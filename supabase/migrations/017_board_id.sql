-- Migration 017: add board_id FK to pinterest_image
-- Images now reference their board by ID so renames/deletes are handled
-- correctly across concurrent sessions.

ALTER TABLE pinterest_image
  ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES pinterest_board(id) ON DELETE SET NULL;

-- Backfill: match existing board text name within the same project
UPDATE pinterest_image pi
SET board_id = pb.id
FROM pinterest_board pb
WHERE pb.project_id = pi.project_id
  AND pb.name = pi.board
  AND pi.board_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pinterest_image_board_id ON pinterest_image(board_id);
