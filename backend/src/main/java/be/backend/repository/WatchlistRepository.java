package be.backend.repository;

import be.backend.entity.Watchlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Integer> {

    @Query("SELECT w FROM Watchlist w JOIN FETCH w.tmdb m WHERE w.user.id = :userId ORDER BY w.addedAt DESC")
    Page<Watchlist> findByUser_IdOrderByAddedAtDesc(@Param("userId") Integer userId, Pageable pageable);

    boolean existsByUser_IdAndTmdb_Id(Integer userId, Integer movieId);

    Optional<Watchlist> findByUser_IdAndTmdb_Id(Integer userId, Integer movieId);
}
