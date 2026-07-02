package be.backend.repository;

import be.backend.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Integer> {

    Page<Movie> findByIsActiveTrue(Pageable pageable);
    long countByIsActiveTrue();

    @EntityGraph(attributePaths = {
            "movieGenres", "movieGenres.genre",
            "moviePeople",  "moviePeople.person"
    })
    Optional<Movie> findByIdAndIsActiveTrue(Integer id);

    @Query("""
            SELECT m FROM Movie m
            WHERE m.isActive = true
              AND (
                    LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR EXISTS (
                        SELECT 1 FROM MoviePerson mp
                        WHERE mp.tmdb = m
                          AND mp.role IN ('ACTOR', 'DIRECTOR')
                          AND LOWER(mp.person.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              )
            """)
    Page<Movie> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
            SELECT m FROM Movie m
            WHERE m.isActive = true
              AND (:title IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')))
              AND (:actor IS NULL OR EXISTS (
                    SELECT 1 FROM MoviePerson mpa
                    WHERE mpa.tmdb = m AND mpa.role = 'ACTOR'
                      AND LOWER(mpa.person.name) LIKE LOWER(CONCAT('%', :actor, '%'))))
              AND (:director IS NULL OR EXISTS (
                    SELECT 1 FROM MoviePerson mpd
                    WHERE mpd.tmdb = m AND mpd.role = 'DIRECTOR'
                      AND LOWER(mpd.person.name) LIKE LOWER(CONCAT('%', :director, '%'))))
            """)
    Page<Movie> searchByFilters(@Param("title") String title,
                                @Param("actor") String actor,
                                @Param("director") String director,
                                Pageable pageable);
    @Query("""
        SELECT m FROM Movie m
        JOIN m.movieGenres mg
        WHERE m.isActive = true
          AND mg.genre.id = :genreId
        """)
    Page<Movie> findActiveByGenre(@Param("genreId") Integer genreId, Pageable pageable);

    @Query("""
        SELECT m FROM Movie m
        WHERE m.isActive = true
          AND (
            SELECT COUNT(DISTINCT mg.genre.id) FROM MovieGenre mg
            WHERE mg.tmdb = m AND mg.genre.id IN :genreIds
          ) = :genreCount
        """)
    Page<Movie> findActiveByMultipleGenres(@Param("genreIds") List<Integer> genreIds,
                                           @Param("genreCount") long genreCount,
                                           Pageable pageable);

    @Query("""
        SELECT m.id, 
               (SELECT COUNT(v) FROM ViewLog v WHERE v.tmdb.id = m.id),
               (SELECT COUNT(r) FROM Review r WHERE r.tmdb.id = m.id),
               (SELECT COUNT(w) FROM Watchlist w WHERE w.tmdb.id = m.id),
               (SELECT AVG(r2.rating) FROM Review r2 WHERE r2.tmdb.id = m.id)
        FROM Movie m WHERE m.id IN :movieIds
    """)
 List<Object[]> findMovieStatsBatch(@Param("movieIds") List<Integer> movieIds);
    long countByIsPremiumTrue();
}