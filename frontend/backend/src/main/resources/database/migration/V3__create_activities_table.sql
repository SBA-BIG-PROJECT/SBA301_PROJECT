-- ============================================================
-- V3: Payment · Watchlist · ViewLog · Review
-- ============================================================

CREATE TABLE payment (
                         payment_id      INT           AUTO_INCREMENT PRIMARY KEY,
                         user_id         INT           NOT NULL,
                         plan_type       VARCHAR(20)   NOT NULL,                    -- 'MONTHLY' | 'YEARLY'
                         amount          DECIMAL(10,2) NOT NULL,
                         status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',  -- PENDING | SUCCESS | FAILED | CANCELLED | EXPIRED
                         order_code      INT           NOT NULL UNIQUE,             -- PayOS order code
                         payment_link_id VARCHAR(100)  NULL,                        -- PayOS trả về khi tạo link
                         transaction_id  VARCHAR(100)  NULL,                        -- Mã tham chiếu ngân hàng từ webhook
                         paid_at         DATETIME      NULL,
                         starts_at       DATETIME      NULL,
                         expires_at      DATETIME      NULL,
                         created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_payment_user
                             FOREIGN KEY (user_id) REFERENCES users(user_id)
                                 ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_payment_user_expires ON payment (user_id, expires_at);
CREATE INDEX idx_payment_order_code   ON payment (order_code);

-- ============================================================
CREATE TABLE watchlist (
                           watchlist_id INT      AUTO_INCREMENT PRIMARY KEY,
                           user_id      INT      NOT NULL,
                           tmdb_id      INT      NOT NULL,
                           added_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           UNIQUE KEY uq_watchlist_user_movie (user_id, tmdb_id),

                           CONSTRAINT fk_watchlist_user  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                           CONSTRAINT fk_watchlist_movie FOREIGN KEY (tmdb_id) REFERENCES movie(tmdb_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
CREATE TABLE view_log (
                          view_id        INT      AUTO_INCREMENT PRIMARY KEY,
                          user_id        INT      NOT NULL,
                          tmdb_id        INT      NOT NULL,
                          watched_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          watch_duration INT      NULL COMMENT 'Thời gian xem tính bằng giây',

                          CONSTRAINT fk_viewlog_user  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                          CONSTRAINT fk_viewlog_movie FOREIGN KEY (tmdb_id) REFERENCES movie(tmdb_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_viewlog_user ON view_log (user_id, watched_at DESC);

-- ============================================================
CREATE TABLE review (
                        review_id  INT          AUTO_INCREMENT PRIMARY KEY,
                        user_id    INT          NOT NULL,
                        tmdb_id    INT          NOT NULL,
                        rating     DECIMAL(3,1) NOT NULL,
                        comment    TEXT,
                        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

                        UNIQUE KEY uq_review_user_movie (user_id, tmdb_id),

                        CONSTRAINT chk_rating      CHECK (rating >= 0.5 AND rating <= 10.0),
                        CONSTRAINT fk_review_user  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                        CONSTRAINT fk_review_movie FOREIGN KEY (tmdb_id) REFERENCES movie(tmdb_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;