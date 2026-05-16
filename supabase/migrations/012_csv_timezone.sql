-- ═══════════════════════════════════════════════════════════════════════════════
-- 012_csv_timezone.sql
-- Adds the timezone used when writing Pinterest CSV publish dates.
--
-- Pinterest's bulk-CSV importer interprets the naked "Publish date" in the
-- Pinterest account's timezone. We store every publish date as a UTC instant,
-- so on export we must render the wall-clock for a fixed, user-chosen zone
-- (set this to match the Pinterest account) instead of whatever timezone the
-- machine running the export happens to be in.
-- ═══════════════════════════════════════════════════════════════════════════════

alter table metadata_settings
  add column if not exists csv_timezone text not null default 'Europe/Berlin';
