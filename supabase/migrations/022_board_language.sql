-- 022_board_language.sql
-- Adds a per-project language setting for AI board name recommendations,
-- separate from the general output language (ai_default_language) which
-- controls title and description generation.

alter table metadata_settings
  add column if not exists ai_board_language text not null default 'English';
