-- ============================================================
-- V5: Person · Movie Person
-- Surrogate key cho movie_person → IntelliJ chỉ tạo MoviePerson
-- không tạo thêm MoviePersonId
-- ============================================================

CREATE TABLE person (
                        person_id    INT          PRIMARY KEY,
                        name         VARCHAR(255) NOT NULL,
                        profile_path VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_person (
                              id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                              tmdb_id        INT          NOT NULL,
                              person_id      INT          NOT NULL,
                              role           VARCHAR(20)  NOT NULL,
                              character_name VARCHAR(255) NULL,
                              cast_order     INT          NULL,

                              UNIQUE KEY uq_movie_person_role (tmdb_id, person_id, role),

                              CONSTRAINT fk_mp_movie  FOREIGN KEY (tmdb_id)   REFERENCES movie(tmdb_id)    ON DELETE CASCADE,
                              CONSTRAINT fk_mp_person FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_movie_person_role  ON movie_person (tmdb_id, role);
CREATE INDEX idx_movie_person_order ON movie_person (tmdb_id, role, cast_order ASC);