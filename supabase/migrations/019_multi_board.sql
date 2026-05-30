-- 019: An image (pin) can belong to MULTIPLE Pinterest boards at once.
--
-- Pinterest allows a pin to live on several boards. We model that with a join
-- table. The legacy single-board columns on pinterest_image (board, board_id)
-- are kept and stay synced to the PRIMARY (first) board so existing consumers
-- — calendar, dashboard, admin analytics — keep working unchanged. The join
-- table is the source of truth for the full board set (editor, bulk, CSV).

CREATE TABLE IF NOT EXISTS pinterest_image_board (
  image_id   UUID NOT NULL REFERENCES image(id)            ON DELETE CASCADE,
  board_id   UUID NOT NULL REFERENCES pinterest_board(id)  ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES metadata_project(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (image_id, board_id)
);

CREATE INDEX IF NOT EXISTS idx_pib_image   ON pinterest_image_board(image_id);
CREATE INDEX IF NOT EXISTS idx_pib_board   ON pinterest_image_board(board_id);
CREATE INDEX IF NOT EXISTS idx_pib_project ON pinterest_image_board(project_id);

ALTER TABLE pinterest_image_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pib_auth_all" ON pinterest_image_board
  FOR ALL USING (auth.role() = 'authenticated');

-- Backfill: every image that currently has a single board becomes one
-- membership row in the join table.
INSERT INTO pinterest_image_board (image_id, board_id, project_id)
SELECT pi.image_id, pi.board_id, pi.project_id
FROM pinterest_image pi
WHERE pi.board_id IS NOT NULL
ON CONFLICT (image_id, board_id) DO NOTHING;
