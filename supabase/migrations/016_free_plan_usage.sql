-- ═══════════════════════════════════════════════════════════════════════════════
-- 016_free_plan_usage.sql
--
-- Per-user lifetime usage counters for the Free (testing) plan.
--
--   • Two independent caps: image uploads and AI metadata generations.
--   • Counters are increment-only — deleting images does NOT free up quota, so
--     the Free plan behaves like a trial allowance.
--   • Pro (paid) users bypass the caps entirely (enforced in the server layer).
--
-- The limit *values* (200 uploads / 500 AI generations) live in code
-- (server/utils/plan.ts → FREE_PLAN_LIMITS) so they can be changed instantly
-- without another migration. This table only tracks consumption.
--
-- Idempotent + safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists plan_usage (
  user_id        uuid        primary key references app_user(id) on delete cascade,
  image_uploads  integer     not null default 0 check (image_uploads  >= 0),
  ai_generations integer     not null default 0 check (ai_generations >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Reuse set_updated_at() defined in 001_initial_schema.sql.
do $$ begin
  create trigger plan_usage_updated_at
    before update on plan_usage
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

alter table plan_usage enable row level security;

-- Users may read their own usage (server writes via the service role).
do $$ begin
  create policy "plan_usage_self_select" on plan_usage
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Atomic upsert-and-increment so concurrent requests can't lose updates.
-- SECURITY DEFINER so the service role can call it; it only ever touches the
-- single counter row for the passed user.
create or replace function increment_plan_usage(
  p_user_id        uuid,
  p_image_uploads  integer default 0,
  p_ai_generations integer default 0
) returns void
language sql security definer set search_path = public as $$
  insert into plan_usage (user_id, image_uploads, ai_generations)
  values (p_user_id, greatest(p_image_uploads, 0), greatest(p_ai_generations, 0))
  on conflict (user_id) do update set
    image_uploads  = plan_usage.image_uploads  + greatest(p_image_uploads, 0),
    ai_generations = plan_usage.ai_generations + greatest(p_ai_generations, 0);
$$;
