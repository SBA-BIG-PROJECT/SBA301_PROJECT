package be.backend.repository;

import be.backend.entity.ViewLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ViewLogRepository extends JpaRepository<ViewLog, Integer> {
    List<ViewLog> findByUser_IdOrderByWatchedAtDesc(Integer userId);

    boolean existsByUser_IdAndTmdb_Id(Integer userId, Integer movieId);

    Optional<ViewLog> findTopByUser_IdOrderByWatchedAtDesc(Integer userId);

    List<ViewLog> findByUser_Id(Integer userId);
    long countByUser_Id(Integer userId);
    long countByTmdb_Id(Integer tmdbId);

    List<ViewLog> findTop20ByUser_IdOrderByWatchedAtDesc(Integer userId);

    @Query(value = """
       SELECT v.tmdb.id
       FROM ViewLog v
       WHERE v.watchedAt >= :startDate
       GROUP BY v.tmdb.id
       ORDER BY COUNT(v.id) DESC
       """,
       countQuery = "SELECT COUNT(DISTINCT v.tmdb.id) FROM ViewLog v WHERE v.watchedAt >= :startDate")
    Page<Integer> findTrendingMovieIds(
            @Param("startDate") Instant startDate,
            Pageable pageable
    );

    @Query("""
    SELECT v.tmdb.id, v.tmdb.title, v.tmdb.posterPath, COUNT(v.id) as viewCount
    FROM ViewLog v
    WHERE v.watchedAt BETWEEN :startDate AND :endDate
    GROUP BY v.tmdb.id, v.tmdb.title, v.tmdb.posterPath
    ORDER BY viewCount DESC
""")
    List<Object[]> findMostViewedMovies(@Param("startDate") Instant startDate, 
                                        @Param("endDate") Instant endDate, 
                                        Pageable pageable);

    @Query("""
    select distinct v.user.id
    from ViewLog v
    where v.tmdb.id = :movieId
""")
    List<Integer> findUserIdsByMovieId(
            @Param("movieId") Integer movieId
    );

    @Query("""
    select v.tmdb.id
    from ViewLog v
    where v.user.id in :userIds
    group by v.tmdb.id
    order by count(v.id) desc
""")
    List<Integer> findPopularMoviesByUsers(
            @Param("userIds") List<Integer> userIds,
            Pageable pageable
    );
}



