-- ═══════════════════════════════════════════════════════════════════════════════
-- 006_backfill_users.sql
--
-- The on_auth_user_created trigger added in 004 only fires for NEW auth.users
-- inserts. Anyone who signed in *before* 004 was applied has no app_user or
-- credit_wallet row, which makes /api/me 500 and the dashboard show no credits.
--
-- This migration backfills those rows idempotently. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Create app_user rows for every auth.users that doesn't have one.
insert into app_user (id, email, name, role, plan)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    split_part(u.email, '@', 1)
  ),
  'user'::user_role,
  'free'::plan_tier
from auth.users u
left join app_user a on a.id = u.id
where a.id is null;


-- 2) Create credit_wallet rows for every app_user that doesn't have one.
--    Grant 5 signup credits as the trigger would have.
insert into credit_wallet (user_id, purchased_credits_remaining)
select a.id, 5
from app_user a
left join credit_wallet w on w.user_id = a.id
where w.user_id is null;


-- 3) Write a signup_grant ledger entry for backfilled users so the credit
--    audit trail isn't broken. Skip if any signup_grant entry already exists
--    for that user (covers re-runs).
insert into credit_ledger (user_id, type, amount, reason)
select a.id, 'signup_grant', 5, 'Backfilled — Free plan signup'
from app_user a
where not exists (
  select 1 from credit_ledger l
  where l.user_id = a.id and l.type = 'signup_grant'
);
