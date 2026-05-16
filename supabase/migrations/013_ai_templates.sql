-- ═══════════════════════════════════════════════════════════════════════════════
-- 013_ai_templates.sql
-- Stores named AI generation templates (saved option sets).
-- Single-tenant admin tool — no user_id needed; RLS restricts to auth users.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists ai_generation_templates (
  id          uuid         primary key default gen_random_uuid(),
  name        text         not null check (char_length(name) between 1 and 100),
  options     jsonb        not null default '{}',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create trigger ai_generation_templates_updated_at
  before update on ai_generation_templates
  for each row execute function set_updated_at();

alter table ai_generation_templates enable row level security;

create policy "ai_templates_auth_all"
  on ai_generation_templates for all using (auth.role() = 'authenticated');
