-- ═══════════════════════════════════════════════════════════════════════════════
-- 004_saas_schema.sql — Wall Art Visualizer SaaS schema
--
-- Adds the SaaS domain (users, billing, credits, projects, gallery, AI runs).
-- Independent from the existing image/pinterest/adobe tables in 001-003 — those
-- belong to the internal Pinterest export tool and are not touched here.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── ENUMS ────────────────────────────────────────────────────────────────────

do $$ begin
  create type plan_tier        as enum ('free', 'starter', 'plus', 'studio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status_t as enum (
    'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role         as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_entry_type as enum (
    'monthly_grant', 'signup_grant', 'purchase', 'spend', 'refund', 'admin_adjustment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type render_quality   as enum ('quick', 'realistic', 'high_quality');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visualization_status as enum ('pending', 'running', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type placement_mode_t as enum ('flat', 'perspective', 'replace_existing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type artwork_source   as enum ('upload', 'gallery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type export_type_t    as enum ('low_res', 'hd', 'before_after', 'pdf_report');
exception when duplicate_object then null; end $$;


-- ─── APP USER ─────────────────────────────────────────────────────────────────
-- 1:1 with auth.users. id IS the auth.users id (shared PK).

create table if not exists app_user (
  id                                uuid        primary key references auth.users(id) on delete cascade,
  email                             text        not null,
  name                              text,
  role                              user_role   not null default 'user',
  plan                              plan_tier   not null default 'free',
  stripe_customer_id                text        unique,
  subscription_status               subscription_status_t,
  subscription_current_period_end   timestamptz,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

create index if not exists idx_app_user_email on app_user(email);
create index if not exists idx_app_user_role  on app_user(role);


-- ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

create table if not exists subscription (
  id                       uuid                  primary key default gen_random_uuid(),
  user_id                  uuid                  not null references app_user(id) on delete cascade,
  stripe_subscription_id   text                  not null unique,
  stripe_customer_id       text                  not null,
  plan                     plan_tier             not null,
  status                   subscription_status_t not null,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean               not null default false,
  created_at               timestamptz           not null default now(),
  updated_at               timestamptz           not null default now()
);

create index if not exists idx_subscription_user      on subscription(user_id);
create index if not exists idx_subscription_status    on subscription(status);


-- ─── CREDIT WALLET ────────────────────────────────────────────────────────────
-- 1:1 with app_user. Tracks current balance only.
-- "reserved" credits are deducted from the available balance when a job starts;
-- they are finalized on success or refunded on failure.

create table if not exists credit_wallet (
  id                            uuid        primary key default gen_random_uuid(),
  user_id                       uuid        not null unique references app_user(id) on delete cascade,
  monthly_credits_remaining     integer     not null default 0 check (monthly_credits_remaining >= 0),
  monthly_credits_total         integer     not null default 0 check (monthly_credits_total >= 0),
  purchased_credits_remaining   integer     not null default 0 check (purchased_credits_remaining >= 0),
  reserved_credits              integer     not null default 0 check (reserved_credits >= 0),
  reset_date                    timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index if not exists idx_credit_wallet_user on credit_wallet(user_id);


-- ─── CREDIT LEDGER ────────────────────────────────────────────────────────────
-- Append-only audit log of every credit movement.
-- amount > 0 = credit granted, amount < 0 = credit consumed.

create table if not exists credit_ledger (
  id                  uuid              primary key default gen_random_uuid(),
  user_id             uuid              not null references app_user(id) on delete cascade,
  type                ledger_entry_type not null,
  amount              integer           not null,
  reason              text,
  project_id          uuid,
  visualization_id    uuid,
  stripe_payment_id   text,
  created_at          timestamptz       not null default now()
);

create index if not exists idx_credit_ledger_user       on credit_ledger(user_id, created_at desc);
create index if not exists idx_credit_ledger_type       on credit_ledger(type);
create index if not exists idx_credit_ledger_visual     on credit_ledger(visualization_id);


-- ─── PROJECT ──────────────────────────────────────────────────────────────────

create table if not exists project (
  id                      uuid             primary key default gen_random_uuid(),
  user_id                 uuid             not null references app_user(id) on delete cascade,
  title                   text             not null default 'Untitled',
  room_image_url          text,
  selected_wall_area      jsonb,
  placement_mode          placement_mode_t not null default 'flat',
  best_score              integer,
  created_at              timestamptz      not null default now(),
  updated_at              timestamptz      not null default now()
);

create index if not exists idx_project_user on project(user_id, updated_at desc);


-- ─── ARTWORK IMAGE ────────────────────────────────────────────────────────────
-- User-uploaded artwork OR a snapshot of a gallery_item used in a visualization.

create table if not exists artwork_image (
  id                  uuid            primary key default gen_random_uuid(),
  user_id             uuid            references app_user(id) on delete cascade,
  image_url           text            not null,
  title               text,
  source              artwork_source  not null,
  gallery_item_id     uuid,
  dominant_colors     jsonb,
  aspect_ratio        text,
  created_at          timestamptz     not null default now()
);

create index if not exists idx_artwork_user    on artwork_image(user_id);
create index if not exists idx_artwork_gallery on artwork_image(gallery_item_id);


-- ─── GALLERY ITEM ─────────────────────────────────────────────────────────────
-- Curated artwork shown to all users in the in-app gallery.

create table if not exists gallery_item (
  id              uuid        primary key default gen_random_uuid(),
  pin_id          text        unique,
  title           text        not null,
  image_url       text        not null,
  thumbnail_url   text,
  dominant_colors jsonb,
  tags            text[]      not null default '{}',
  style           text,
  mood            text,
  format          text,
  room_type       text,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_gallery_active     on gallery_item(is_active);
create index if not exists idx_gallery_style      on gallery_item(style);
create index if not exists idx_gallery_mood       on gallery_item(mood);
create index if not exists idx_gallery_room_type  on gallery_item(room_type);

-- foreign key from artwork_image to gallery_item, set after gallery_item exists
do $$ begin
  alter table artwork_image
    add constraint artwork_image_gallery_fk
    foreign key (gallery_item_id) references gallery_item(id) on delete set null;
exception when duplicate_object then null; end $$;


-- ─── VISUALIZATION ────────────────────────────────────────────────────────────
-- One generation run. Lives inside a project; references the artwork used.

create table if not exists visualization (
  id                  uuid                  primary key default gen_random_uuid(),
  project_id          uuid                  not null references project(id) on delete cascade,
  user_id             uuid                  not null references app_user(id) on delete cascade,
  artwork_image_id    uuid                  references artwork_image(id) on delete set null,
  result_image_url    text,
  render_quality      render_quality        not null default 'quick',
  placement_data      jsonb,
  style_match_score   integer               check (style_match_score between 0 and 100),
  color_match_score   integer               check (color_match_score between 0 and 100),
  size_match_score    integer               check (size_match_score between 0 and 100),
  style_score         integer               check (style_score between 0 and 100),
  room_harmony_score  integer               check (room_harmony_score between 0 and 100),
  credits_spent       integer               not null default 0 check (credits_spent >= 0),
  status              visualization_status  not null default 'pending',
  error_message       text,
  created_at          timestamptz           not null default now(),
  updated_at          timestamptz           not null default now()
);

create index if not exists idx_visualization_project on visualization(project_id, created_at desc);
create index if not exists idx_visualization_user    on visualization(user_id, created_at desc);
create index if not exists idx_visualization_status  on visualization(status);

-- back-reference from credit_ledger.visualization_id (soft, no FK so we can keep
-- ledger entries even after a visualization is deleted)


-- ─── AI RECOMMENDATION ────────────────────────────────────────────────────────

create table if not exists ai_recommendation (
  id                       uuid        primary key default gen_random_uuid(),
  visualization_id         uuid        not null references visualization(id) on delete cascade,
  explanation              text,
  color_tips               jsonb,
  size_tips                jsonb,
  position_tips            jsonb,
  style_tips               jsonb,
  alternative_suggestions  jsonb,
  created_at               timestamptz not null default now()
);

create index if not exists idx_ai_recommendation_visual on ai_recommendation(visualization_id);


-- ─── EXPORT ───────────────────────────────────────────────────────────────────
-- "export" is reserved by some tools, so the table is named export_record.

create table if not exists export_record (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references app_user(id) on delete cascade,
  project_id        uuid          references project(id) on delete cascade,
  visualization_id  uuid          references visualization(id) on delete set null,
  export_type       export_type_t not null,
  file_url          text          not null,
  has_watermark     boolean       not null default false,
  created_at        timestamptz   not null default now()
);

create index if not exists idx_export_user    on export_record(user_id, created_at desc);
create index if not exists idx_export_project on export_record(project_id);


-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────
-- Reuse set_updated_at() defined in 001_initial_schema.sql.

create trigger app_user_updated_at      before update on app_user      for each row execute function set_updated_at();
create trigger subscription_updated_at  before update on subscription  for each row execute function set_updated_at();
create trigger credit_wallet_updated_at before update on credit_wallet for each row execute function set_updated_at();
create trigger project_updated_at       before update on project       for each row execute function set_updated_at();
create trigger gallery_item_updated_at  before update on gallery_item  for each row execute function set_updated_at();
create trigger visualization_updated_at before update on visualization for each row execute function set_updated_at();


-- ─── PROVISION app_user + credit_wallet ON SIGNUP ─────────────────────────────
-- New auth.users row → app_user (Free plan) + credit_wallet (5 signup credits)
-- + signup_grant ledger entry. All in one transaction.

create or replace function provision_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  signup_credits constant integer := 5;
  display_name   text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into app_user (id, email, name, role, plan)
  values (new.id, new.email, display_name, 'user', 'free')
  on conflict (id) do nothing;

  insert into credit_wallet (user_id, purchased_credits_remaining)
  values (new.id, signup_credits)
  on conflict (user_id) do nothing;

  insert into credit_ledger (user_id, type, amount, reason)
  values (new.id, 'signup_grant', signup_credits, 'Welcome — Free plan signup');

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function provision_new_user();


-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

alter table app_user           enable row level security;
alter table subscription       enable row level security;
alter table credit_wallet      enable row level security;
alter table credit_ledger      enable row level security;
alter table project            enable row level security;
alter table artwork_image      enable row level security;
alter table gallery_item       enable row level security;
alter table visualization      enable row level security;
alter table ai_recommendation  enable row level security;
alter table export_record      enable row level security;

-- app_user: users see/update their own row only
create policy "app_user_self_select" on app_user
  for select using (id = auth.uid());
create policy "app_user_self_update" on app_user
  for update using (id = auth.uid());

-- subscription: users read their own, server writes via service role
create policy "subscription_self_select" on subscription
  for select using (user_id = auth.uid());

-- credit_wallet: users read their own, server writes via service role
create policy "credit_wallet_self_select" on credit_wallet
  for select using (user_id = auth.uid());

-- credit_ledger: users read their own, server writes via service role
create policy "credit_ledger_self_select" on credit_ledger
  for select using (user_id = auth.uid());

-- project: full ownership for the user
create policy "project_owner_select" on project
  for select using (user_id = auth.uid());
create policy "project_owner_insert" on project
  for insert with check (user_id = auth.uid());
create policy "project_owner_update" on project
  for update using (user_id = auth.uid());
create policy "project_owner_delete" on project
  for delete using (user_id = auth.uid());

-- artwork_image: full ownership; user_id may be null only for gallery clones (server-side)
create policy "artwork_owner_select" on artwork_image
  for select using (user_id = auth.uid());
create policy "artwork_owner_insert" on artwork_image
  for insert with check (user_id = auth.uid());
create policy "artwork_owner_update" on artwork_image
  for update using (user_id = auth.uid());
create policy "artwork_owner_delete" on artwork_image
  for delete using (user_id = auth.uid());

-- gallery_item: anyone can read active items
create policy "gallery_public_read" on gallery_item
  for select using (is_active = true);

-- visualization: full ownership
create policy "visualization_owner_select" on visualization
  for select using (user_id = auth.uid());
create policy "visualization_owner_insert" on visualization
  for insert with check (user_id = auth.uid());
create policy "visualization_owner_update" on visualization
  for update using (user_id = auth.uid());
create policy "visualization_owner_delete" on visualization
  for delete using (user_id = auth.uid());

-- ai_recommendation: read if you own the parent visualization
create policy "ai_rec_via_visualization" on ai_recommendation
  for select using (
    exists (
      select 1 from visualization v
      where v.id = ai_recommendation.visualization_id
        and v.user_id = auth.uid()
    )
  );

-- export_record: full ownership
create policy "export_owner_select" on export_record
  for select using (user_id = auth.uid());
create policy "export_owner_insert" on export_record
  for insert with check (user_id = auth.uid());
create policy "export_owner_delete" on export_record
  for delete using (user_id = auth.uid());

-- Admin override: users with role='admin' get full read across SaaS tables
create policy "app_user_admin_all" on app_user
  for all using (
    exists (select 1 from app_user a where a.id = auth.uid() and a.role = 'admin')
  );
create policy "gallery_item_admin_all" on gallery_item
  for all using (
    exists (select 1 from app_user a where a.id = auth.uid() and a.role = 'admin')
  );
