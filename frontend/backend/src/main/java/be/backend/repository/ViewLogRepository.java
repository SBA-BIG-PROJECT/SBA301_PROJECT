package be.backend.repository;

import be.backend.entity.ViewLog;
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

    List<ViewLog> findTop20ByUser_IdOrderByWatchedAtDesc(Integer userId);

    @Query("""
    SELECT v.tmdb.id
    FROM ViewLog v
    GROUP BY v.tmdb.id
    ORDER BY COUNT(v.id) DESC
""")
    List<Integer> findTrendingMovieIds(Pageable pageable);

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
}

