-- ═══════════════════════════════════════════════════════════════════════════════
-- 015_pinterest_analytics.sql
--
-- Stores what we can learn from a Pinterest Business "Analytics overview" CSV
-- export, so the tool can (a) auto-populate board names and (b) let the AI
-- make smarter board/description decisions based on what actually performs.
--
-- Two homes for the data:
--   • pinterest_board  — per-board performance counters (queryable, shown in
--     the Boards UI, fed straight into board-intelligence).
--   • metadata_project — account handle + a JSON snapshot of the whole import
--     (period, outbound-click trend, top-pin aggregates, full board ranking
--     incl. boards the user chose not to create). The "everything useful"
--     bucket the AI/dashboard can read without extra columns.
--
-- All columns nullable — analytics are optional and only present after an
-- import. Idempotent + safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── PER-BOARD PERFORMANCE ────────────────────────────────────────────────────
-- Raw counters straight from the "Top Boards" table for the imported window.
-- Rates are derived on read (engagement/impressions etc.) — we keep the raw
-- numbers so the window can change without lossy recomputation.

alter table pinterest_board add column if not exists stat_impressions       bigint;
alter table pinterest_board add column if not exists stat_engagement        bigint;
alter table pinterest_board add column if not exists stat_pin_clicks        bigint;
alter table pinterest_board add column if not exists stat_outbound_clicks   bigint;
alter table pinterest_board add column if not exists stat_saves             bigint;
alter table pinterest_board add column if not exists stat_period_start      date;
alter table pinterest_board add column if not exists stat_period_end        date;
alter table pinterest_board add column if not exists stats_updated_at       timestamptz;

-- Lets board-intelligence cheaply pull the project's top performers.
create index if not exists idx_pinterest_board_impressions
  on pinterest_board (project_id, stat_impressions desc nulls last);


-- ─── PROJECT-LEVEL ANALYTICS SNAPSHOT ─────────────────────────────────────────
-- pinterest_handle: the @handle parsed from board URLs (e.g. "DigiDesignArt").
-- pinterest_analytics: full parsed snapshot —
--   {
--     handle, period: { start, end },
--     outboundClicks: { total, perDay, avgPerDay, trend, bestDay },
--     boards: [ { slug, name, system, impressions, engagement,
--                 pinClicks, outboundClicks, saves } ],
--     pins:   { count, organicShare, canonicalShare,
--               impressions: { max, median, p25, total } },
--     topThemes: [ "landscapes", "abstracts", ... ],
--     importedAt
--   }

alter table metadata_project add column if not exists pinterest_handle    text;
alter table metadata_project add column if not exists pinterest_analytics jsonb;
