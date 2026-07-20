-- ============================================================
-- V10: Add performance indexes for admin analytics and queries
-- ============================================================

-- Payment indexes
CREATE INDEX idx_payment_status ON payment (status);
CREATE INDEX idx_payment_status_paid_at ON payment (status, paid_at);
CREATE INDEX idx_payment_user_status ON payment (user_id, status);

-- ViewLog indexes
CREATE INDEX idx_viewlog_tmdb ON view_log (tmdb_id);
CREATE INDEX idx_viewlog_tmdb_watched_at ON view_log (tmdb_id, watched_at);

-- User indexes
CREATE INDEX idx_users_created_at ON users (created_at);

-- Movie indexes
CREATE INDEX idx_movie_is_active ON movie (is_active);
CREATE INDEX idx_movie_is_active_added_at ON movie (is_active, added_at);

-- Review indexes
CREATE INDEX idx_review_tmdb ON review (tmdb_id);
CREATE INDEX idx_review_created_at ON review (created_at);
