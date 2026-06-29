-- Remove foreign key from notification -> recommendation
ALTER TABLE notification
DROP FOREIGN KEY fk_notif_rec;

-- Remove recommendation reference in notification
ALTER TABLE notification
DROP COLUMN rec_id;

-- Drop recommendation table
DROP TABLE recommendation;