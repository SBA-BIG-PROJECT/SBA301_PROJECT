-- ============================================================
-- V1: Users · Movie · Genre · Category · Junction tables
-- ============================================================

CREATE TABLE users (
                       user_id            INT          AUTO_INCREMENT PRIMARY KEY,
                       email              VARCHAR(255) NOT NULL UNIQUE,
                       password_hash      VARCHAR(255) NOT NULL,
                       full_name          VARCHAR(255),
                       age                INT,
                       role               VARCHAR(20)  NOT NULL DEFAULT 'VIEWER',
                       is_premium         BOOLEAN      NOT NULL DEFAULT FALSE,
                       premium_expires_at DATETIME     NULL,
                       created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
CREATE TABLE movie (
                       tmdb_id       INT          PRIMARY KEY,
                       title         VARCHAR(500) NOT NULL,
                       overview      TEXT,
                       poster_path   VARCHAR(500),
                       backdrop_path VARCHAR(500),
                       release_date  DATE,
                       vote_average  DOUBLE,
                       vote_count    INT,
                       trailer_url   VARCHAR(500),
                       added_by      INT          NULL,
                       added_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       is_active     BOOLEAN      NOT NULL DEFAULT TRUE,

                       CONSTRAINT fk_movie_admin
                           FOREIGN KEY (added_by) REFERENCES users(user_id)
                               ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
CREATE TABLE genre (
                       genre_id INT          PRIMARY KEY,
                       name     VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category (
                          category_id VARCHAR(50)  PRIMARY KEY,
                          name        VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO category (category_id, name) VALUES
                                             ('trending',    'Xu hướng'),
                                             ('now_playing', 'Đang chiếu'),
                                             ('top_rated',   'Đánh giá cao'),
                                             ('upcoming',    'Sắp chiếu');


CREATE TABLE movie_genre (
                             id       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                             tmdb_id  INT NOT NULL,
                             genre_id INT NOT NULL,

                             UNIQUE KEY uq_movie_genre (tmdb_id, genre_id),

                             CONSTRAINT fk_mg_movie FOREIGN KEY (tmdb_id)  REFERENCES movie(tmdb_id)  ON DELETE CASCADE,
                             CONSTRAINT fk_mg_genre FOREIGN KEY (genre_id) REFERENCES genre(genre_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE movie_category (
                                id          INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                tmdb_id     INT         NOT NULL,
                                category_id VARCHAR(50) NOT NULL,

                                UNIQUE KEY uq_movie_category (tmdb_id, category_id),

                                CONSTRAINT fk_mc_movie    FOREIGN KEY (tmdb_id)     REFERENCES movie(tmdb_id)        ON DELETE CASCADE,
                                CONSTRAINT fk_mc_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
) ENGINE=InnoDB;