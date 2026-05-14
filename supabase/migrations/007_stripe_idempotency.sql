-- ═══════════════════════════════════════════════════════════════════════════════
-- 007_stripe_idempotency.sql
--
-- Webhook idempotency primitives. Stripe retries failed webhook deliveries and
-- can also re-send events; without these guards a credit pack purchase could
-- be granted multiple times.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── Dedupe webhook events by Stripe event ID ────────────────────────────────
-- Inserted at the top of the webhook handler with `on conflict do nothing`.
-- If the row already exists we know the event has been processed and we can
-- short-circuit safely.

create table if not exists stripe_event (
  id          text        primary key,         -- evt_… from Stripe
  type        text        not null,
  received_at timestamptz not null default now(),
  payload     jsonb
);

alter table stripe_event enable row level security;
-- No public policies — only the service role (used in the webhook) writes here.


-- ─── Unique credit-ledger entry per stripe_payment_id ────────────────────────
-- A second insert with the same payment ID will fail loudly so we never
-- double-credit, even if the webhook AND the checkout-session-completed
-- handler both try to grant.
--
-- Partial: most rows have stripe_payment_id NULL (signup grants, manual
-- adjustments, monthly grants). The constraint only applies when present.

create unique index if not exists credit_ledger_stripe_payment_unique
  on credit_ledger (user_id, stripe_payment_id)
  where stripe_payment_id is not null;
