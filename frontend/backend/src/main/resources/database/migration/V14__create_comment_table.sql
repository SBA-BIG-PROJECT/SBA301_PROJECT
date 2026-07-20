CREATE TABLE comment (
                         comment_id        INT      AUTO_INCREMENT PRIMARY KEY,
                         user_id           INT      NOT NULL,
                         tmdb_id           INT      NOT NULL,
                         parent_comment_id INT      NULL,
                         content           TEXT     NOT NULL,
                         like_count        INT      NOT NULL DEFAULT 0,
                         is_edited         BOOLEAN  NOT NULL DEFAULT FALSE,
                         is_deleted        BOOLEAN  NOT NULL DEFAULT FALSE,
                         created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                         CONSTRAINT fk_comment_user   FOREIGN KEY (user_id)           REFERENCES users(user_id)      ON DELETE CASCADE,
                         CONSTRAINT fk_comment_movie  FOREIGN KEY (tmdb_id)           REFERENCES movie(tmdb_id)      ON DELETE CASCADE,
                         CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_comment_movie  ON comment (tmdb_id, created_at DESC);
CREATE INDEX idx_comment_parent ON comment (parent_comment_id);
CREATE INDEX idx_comment_user   ON comment (user_id);

CREATE TABLE comment_like (
                              comment_like_id INT      AUTO_INCREMENT PRIMARY KEY,
                              comment_id      INT      NOT NULL,
                              user_id         INT      NOT NULL,
                              created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              UNIQUE KEY uq_comment_like (comment_id, user_id),
                              CONSTRAINT fk_clike_comment FOREIGN KEY (comment_id) REFERENCES comment(comment_id) ON DELETE CASCADE,
                              CONSTRAINT fk_clike_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;