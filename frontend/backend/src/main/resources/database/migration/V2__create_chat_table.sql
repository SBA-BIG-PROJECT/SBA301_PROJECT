-- ============================================================
-- V2: Chat Session · Chat Message
-- role VARCHAR thay vì ENUM — khớp trực tiếp format AI API
-- ============================================================

CREATE TABLE chat_session (
                              session_id INT      AUTO_INCREMENT PRIMARY KEY,
                              user_id    INT      NOT NULL,
                              started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_session_user
                                  FOREIGN KEY (user_id) REFERENCES users(user_id)
                                      ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_message (
                              message_id INT          AUTO_INCREMENT PRIMARY KEY,
                              session_id INT          NOT NULL,
    -- 'user' = người dùng gõ | 'assistant' = AI trả lời
                              role       VARCHAR(20)  NOT NULL,
                              content    TEXT         NOT NULL,
                              sent_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_message_session
                                  FOREIGN KEY (session_id) REFERENCES chat_session(session_id)
                                      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_chat_message_session ON chat_message (session_id, sent_at ASC);