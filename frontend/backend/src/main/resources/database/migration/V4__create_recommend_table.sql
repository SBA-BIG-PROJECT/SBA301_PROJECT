-- ============================================================
-- V4: Recommendation · Notification
-- ============================================================

CREATE TABLE recommendation (
                                rec_id     INT          AUTO_INCREMENT PRIMARY KEY,
                                user_id    INT          NOT NULL,
                                tmdb_id    INT          NOT NULL,
                                reason     VARCHAR(500),
                                source     VARCHAR(20)  NOT NULL, -- 'VIEW_HISTORY' | 'HIGH_RATING' | 'WATCHLIST'
                                created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_rec_user  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                                CONSTRAINT fk_rec_movie FOREIGN KEY (tmdb_id) REFERENCES movie(tmdb_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_rec_user ON recommendation (user_id, created_at DESC);

-- ============================================================
-- rec_id NULL → thông báo hệ thống
-- rec_id có   → thông báo từ recommendation mới
-- ============================================================
CREATE TABLE notification (
                              not_id     INT      AUTO_INCREMENT PRIMARY KEY,
                              user_id    INT      NOT NULL,
                              rec_id     INT      NULL,
                              message    TEXT     NOT NULL,
                              is_read    BOOLEAN  NOT NULL DEFAULT FALSE,
                              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id)         ON DELETE CASCADE,
                              CONSTRAINT fk_notif_rec  FOREIGN KEY (rec_id)  REFERENCES recommendation(rec_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_notif_user_unread ON notification (user_id, is_read, created_at DESC);