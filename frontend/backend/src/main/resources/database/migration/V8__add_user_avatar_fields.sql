-- Add avatar fields to users table
ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(500) NULL
    COMMENT 'URL of user avatar stored in Cloudinary',
ADD COLUMN avatar_public_id VARCHAR(255) NULL
    COMMENT 'Cloudinary public ID for managing avatar deletion';

CREATE INDEX idx_users_avatar_public_id
    ON users(avatar_public_id);

ALTER TABLE users
    MODIFY COLUMN avatar_url VARCHAR(500) NULL
    COMMENT 'URL of user avatar stored in Cloudinary',
    MODIFY COLUMN avatar_public_id VARCHAR(255) NULL
    COMMENT 'Cloudinary public ID for managing avatar deletion';