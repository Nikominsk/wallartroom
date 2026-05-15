-- ═══════════════════════════════════════════════════════════════════════════════
-- 011_metadata_settings.sql
-- Adds per-board color and a singleton metadata_settings row for AI defaults.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── BOARD COLOR ──────────────────────────────────────────────────────────────
-- Optional. When null, the client falls back to a hash-of-name palette so
-- every board still gets a stable color.
alter table pinterest_board
  add column if not exists color text
    check (color is null or color ~ '^#[0-9a-fA-F]{6}$');


-- ─── METADATA SETTINGS ────────────────────────────────────────────────────────
-- The Pinterest export tool is admin-only and single-tenant, so a singleton
-- row (id=1) is enough. If the tool ever multi-tenants, add a user_id column
-- and a unique constraint per user.
create table if not exists metadata_settings (
  id                          int          primary key default 1
                                           check (id = 1),
  ai_max_title_length         int          not null default 100
                                           check (ai_max_title_length between 10 and 255),
  ai_max_description_length   int          not null default 300
                                           check (ai_max_description_length between 10 and 800),
  ai_default_tone             text         not null default '',
  ai_additional_instructions  text         not null default '',
  ai_default_language         text         not null default 'English',
  updated_at                  timestamptz  not null default now()
);

insert into metadata_settings (id) values (1)
  on conflict (id) do nothing;

create trigger metadata_settings_updated_at
  before update on metadata_settings
  for each row execute function set_updated_at();

alter table metadata_settings enable row level security;

create policy "metadata_settings_auth_all"
  on metadata_settings for all using (auth.role() = 'authenticated');
