-- ============================================================
-- V6: Refresh tokens (JWT auth)
-- ============================================================

CREATE TABLE refresh_tokens (
                                id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
                                token      VARCHAR(100) NOT NULL,
                                user_id    INT          NOT NULL,
                                expires_at DATETIME     NOT NULL,

                                UNIQUE KEY uq_refresh_tokens_token (token),

                                CONSTRAINT fk_refresh_tokens_user
                                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                                        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;