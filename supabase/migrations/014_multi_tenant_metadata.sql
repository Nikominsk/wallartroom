-- ═══════════════════════════════════════════════════════════════════════════════
-- 014_multi_tenant_metadata.sql
--
-- Turns the previously single-tenant /metadata/* Pinterest tool into a
-- multi-user, multi-project workspace.
--
--   • New `metadata_project` table — every user can own many projects.
--   • Every metadata-domain row (images, pins, boards, CSV exports, AI
--     templates, settings) now belongs to exactly one project.
--   • Board name uniqueness moves from GLOBAL → per-project (two projects can
--     both have a "Living Room" board).
--   • `metadata_settings` stops being a single id=1 row and becomes one row
--     per project.
--   • Existing single-tenant data is backfilled into ONE "Default Project"
--     owned by the current admin (nniko.geuenich@gmail.com) so nothing is lost.
--
-- Cloudflare R2 layout is intentionally NOT touched here — all projects keep
-- sharing the existing bucket/prefix. A later migration/task can move each
-- user+project into its own R2 prefix; the schema added here (project_id on
-- every row) is already enough to derive those paths when that happens.
--
-- Tenant isolation is enforced in the server API layer (every endpoint uses
-- the Supabase service-role key, which bypasses RLS). The RLS policies below
-- are added for defence-in-depth / direct-client safety, but the real gate is
-- `server/utils/requireMetadataProject.ts`.
--
-- Idempotent + safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── METADATA PROJECT ─────────────────────────────────────────────────────────
-- A project is a self-contained Pinterest workspace owned by one app_user.

create table if not exists metadata_project (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references app_user(id) on delete cascade,
  name        text         not null check (char_length(name) between 1 and 120),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- A user can't have two projects with the same name (case-insensitive).
create unique index if not exists uq_metadata_project_user_name
  on metadata_project (user_id, lower(name));

create index if not exists idx_metadata_project_user
  on metadata_project (user_id, updated_at desc);

do $$ begin
  create trigger metadata_project_updated_at
    before update on metadata_project
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

alter table metadata_project enable row level security;

do $$ begin
  create policy "metadata_project_owner_all" on metadata_project
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;


-- ─── ADD project_id TO EVERY METADATA-DOMAIN TABLE ────────────────────────────
-- Nullable for now: the backfill below fills existing rows, and the server
-- always sets it on new rows. Kept nullable so this migration stays safe to
-- run even on a database that has no app_user to attach orphans to.

alter table image
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

alter table pinterest_image
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

alter table adobe_image
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

alter table pinterest_board
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

alter table pinterest_csv_export
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

alter table ai_generation_templates
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

create index if not exists idx_image_project              on image(project_id);
create index if not exists idx_pinterest_image_project    on pinterest_image(project_id);
create index if not exists idx_adobe_image_project        on adobe_image(project_id);
create index if not exists idx_pinterest_board_project    on pinterest_board(project_id);
create index if not exists idx_csv_export_project         on pinterest_csv_export(project_id);
create index if not exists idx_ai_templates_project       on ai_generation_templates(project_id);


-- ─── BOARD NAME UNIQUENESS: GLOBAL → PER-PROJECT ──────────────────────────────
-- Migration 002 created `name text not null unique` (constraint
-- pinterest_board_name_key). With multiple tenants that's wrong — drop it and
-- scope uniqueness to the project.

alter table pinterest_board drop constraint if exists pinterest_board_name_key;

create unique index if not exists uq_pinterest_board_project_name
  on pinterest_board (project_id, name);


-- ─── METADATA SETTINGS: SINGLETON → ONE ROW PER PROJECT ───────────────────────
-- Migration 011 declared `id int primary key default 1 check (id = 1)` so only
-- one row could ever exist. Lift that: give `id` a real sequence default and
-- key the table by project_id instead.

alter table metadata_settings drop constraint if exists metadata_settings_id_check;

create sequence if not exists metadata_settings_id_seq owned by metadata_settings.id;

-- Make sure the sequence is ahead of any existing id (the legacy id=1 row).
select setval(
  'metadata_settings_id_seq',
  greatest(coalesce((select max(id) from metadata_settings), 0), 1)
);

alter table metadata_settings
  alter column id set default nextval('metadata_settings_id_seq');

alter table metadata_settings
  add column if not exists project_id uuid
    references metadata_project(id) on delete cascade;

create unique index if not exists uq_metadata_settings_project
  on metadata_settings (project_id);


-- ─── BACKFILL: rescue all existing single-tenant data into one project ────────
-- Strategy:
--   1. Find the owner = the current Pinterest admin (nniko.geuenich@gmail.com).
--      If that app_user doesn't exist yet but there IS legacy image data,
--      fall back to the earliest-created app_user so the data isn't orphaned.
--   2. Create (once) a "Default Project" for that owner.
--   3. Re-point every NULL-project_id row at it, including the legacy
--      metadata_settings id=1 row.
-- If there's no owner candidate at all, this whole block is a no-op — new
-- users simply get fresh projects created for them by the app.

do $$
declare
  v_owner_id   uuid;
  v_project_id uuid;
  v_has_data   boolean;
begin
  select exists (select 1 from image) into v_has_data;

  select id into v_owner_id
  from app_user
  where lower(email) = 'nniko.geuenich@gmail.com'
  limit 1;

  if v_owner_id is null and v_has_data then
    select id into v_owner_id
    from app_user
    order by created_at asc
    limit 1;
  end if;

  -- Nothing to attach data to → leave the schema in place and exit cleanly.
  if v_owner_id is null then
    raise notice '014: no owner candidate found — skipping backfill (schema is ready for new users).';
    return;
  end if;

  -- Reuse an existing "Default Project" for this owner if a previous run made
  -- one; otherwise create it.
  select id into v_project_id
  from metadata_project
  where user_id = v_owner_id and lower(name) = 'default project'
  limit 1;

  if v_project_id is null then
    insert into metadata_project (user_id, name)
    values (v_owner_id, 'Default Project')
    returning id into v_project_id;
  end if;

  update image                  set project_id = v_project_id where project_id is null;
  update pinterest_image        set project_id = v_project_id where project_id is null;
  update adobe_image            set project_id = v_project_id where project_id is null;
  update pinterest_board        set project_id = v_project_id where project_id is null;
  update pinterest_csv_export   set project_id = v_project_id where project_id is null;
  update ai_generation_templates set project_id = v_project_id where project_id is null;

  -- Attach the legacy singleton settings row (id=1) to the default project.
  update metadata_settings set project_id = v_project_id where project_id is null;

  raise notice '014: backfilled legacy metadata into project % (owner %).',
    v_project_id, v_owner_id;
end $$;


-- ─── RLS (defence-in-depth; server uses service-role and is the real gate) ────
-- The pre-existing "auth_all" policies on these tables (migrations 001-013)
-- still apply for any direct authenticated client. Add project-scoped owner
-- policies so a future move to anon/auth-key access stays isolated.

do $$ begin
  create policy "metadata_settings_owner_all" on metadata_settings
    for all using (
      project_id is not null and exists (
        select 1 from metadata_project mp
        where mp.id = metadata_settings.project_id and mp.user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
