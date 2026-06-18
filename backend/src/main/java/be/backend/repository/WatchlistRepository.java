package be.backend.repository;

import be.backend.entity.Watchlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Integer> {
    Page<Watchlist> findByUser_IdOrderByAddedAtDesc(Integer userId, Pageable pageable);

    boolean existsByUser_IdAndTmdb_Id(Integer userId, Integer movieId);

    List<Watchlist> findByUser_Id(Integer userId);

    Watchlist findByUser_IdAndTmdb_Id(Integer userId, Integer movieId);

    Optional<Watchlist> findTopByUser_IdOrderByAddedAtDesc(
            Integer userId
    );

    long countByUser_Id(Integer userId);
    long countByTmdb_Id(Integer tmdbId);

    @Query("""
        SELECT w.tmdb.id, w.tmdb.title, w.tmdb.posterPath, COUNT(w.id) as watchlistCount
        FROM Watchlist w
        GROUP BY w.tmdb.id, w.tmdb.title, w.tmdb.posterPath
        ORDER BY watchlistCount DESC
    """)
    List<Object[]> findMostWatchlistedMovies(Pageable pageable);
}

