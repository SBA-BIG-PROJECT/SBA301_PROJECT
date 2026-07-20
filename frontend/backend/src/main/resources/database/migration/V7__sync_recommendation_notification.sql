-- ============================================================
-- V7: Sync database schema with current entities
-- ============================================================

-- recommendation
ALTER TABLE recommendation
DROP COLUMN score;

-- notification
ALTER TABLE notification
DROP COLUMN action_url,
DROP COLUMN content,
DROP COLUMN title,
DROP COLUMN type;