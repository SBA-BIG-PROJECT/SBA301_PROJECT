package be.backend.repository;

import be.backend.entity.Watchlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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
}

