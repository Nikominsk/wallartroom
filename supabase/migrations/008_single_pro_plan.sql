-- ═══════════════════════════════════════════════════════════════════════════════
-- 008_single_pro_plan.sql
--
-- Product simplification: collapse Starter / Plus / Studio into a single "pro"
-- tier. Free signup tier stays as-is.
--
-- Postgres can't drop values from an existing enum without recreating the type
-- and rewriting every column that uses it. Instead we just ADD 'pro' and stop
-- writing the older labels from the application. The old enum values remain
-- legal-but-unused.
-- ═══════════════════════════════════════════════════════════════════════════════


-- 1) Extend the enum.
do $$ begin
  alter type plan_tier add value if not exists 'pro';
exception when duplicate_object then null; end $$;


-- 2) Migrate any existing rows still on the legacy tiers to 'pro'. Safe to
--    re-run; rows already on 'free' or 'pro' are untouched.
update app_user
   set plan = 'pro'
 where plan in ('starter', 'plus', 'studio');

update subscription
   set plan = 'pro'
 where plan in ('starter', 'plus', 'studio');
