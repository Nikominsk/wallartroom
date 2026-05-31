-- 021: Opt-in email notification for when subscription plans launch.
-- Users in /metadata can tick a checkbox; we set this flag and email them
-- when paid plans go live.

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS notify_plans_launch BOOLEAN NOT NULL DEFAULT FALSE;
