-- 020: Revert 019. Pinterest only allows a pin on one board at a time.
-- Drop the join table that was added for multi-board support.

DROP TABLE IF EXISTS pinterest_image_board;
