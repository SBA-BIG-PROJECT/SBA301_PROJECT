-- ============================================================
-- V9: Admin Features - Role constraint and audit fields
-- ============================================================

-- Update existing VIEWER roles to USER
UPDATE users SET role = 'USER' WHERE role = 'VIEWER';

-- Add admin_notes field for internal notes about users
ALTER TABLE users
ADD COLUMN admin_notes TEXT NULL COMMENT 'Internal admin notes about this user';

-- Add banned fields for user moderation
ALTER TABLE users
ADD COLUMN banned_at DATETIME NULL COMMENT 'When user was banned',
ADD COLUMN banned_reason VARCHAR(500) NULL COMMENT 'Reason for ban';

-- Add deleted_at for soft delete
ALTER TABLE users
ADD COLUMN deleted_at DATETIME NULL COMMENT 'Soft delete timestamp';

-- Add last_login tracking
ALTER TABLE users
ADD COLUMN last_login_at DATETIME NULL COMMENT 'Last successful login time';

-- Create index for admin queries
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_premium ON users (is_premium, premium_expires_at);
CREATE INDEX idx_users_deleted ON users (deleted_at);
CREATE INDEX idx_users_banned ON users (banned_at);

-- Add statistics table for analytics (optional but recommended)
CREATE TABLE IF NOT EXISTS user_activity_stats (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_users INT NOT NULL DEFAULT 0,
    active_users INT NOT NULL DEFAULT 0,
    premium_users INT NOT NULL DEFAULT 0,
    new_users INT NOT NULL DEFAULT 0,
    total_movies INT NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    total_views INT NOT NULL DEFAULT 0,
    revenue_vnd DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_stats_date (date)
) ENGINE=InnoDB;

CREATE INDEX idx_stats_date ON user_activity_stats (date DESC);
