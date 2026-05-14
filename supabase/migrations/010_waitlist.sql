-- Waitlist for the WallArtRoom launch. Email-only signups stored here until
-- the product is ready to invite users in.

create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  created_at  timestamptz not null default now(),
  -- Free-text "source" / "referrer" so we can later attribute signups if we
  -- decide to A/B test landing variants. Not required.
  source      text
);

-- Case-insensitive uniqueness so jane@x.com and JANE@x.com count as the same
-- signup. The insert path also lowercases before write, but this defends against
-- direct DB writes too.
create unique index if not exists waitlist_email_lower_unique on waitlist (lower(email));

alter table waitlist enable row level security;

-- No anon/auth policies on purpose. The signup endpoint runs with the service
-- role and bypasses RLS; direct client reads/writes are blocked.
