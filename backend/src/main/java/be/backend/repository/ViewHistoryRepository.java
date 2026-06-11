package be.backend.repository;

import be.backend.entity.ViewLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ViewHistoryRepository extends JpaRepository<ViewLog, Integer> {

    @Query("SELECT v FROM ViewLog v JOIN FETCH v.tmdb m WHERE v.user.id = :userId ORDER BY v.watchedAt DESC")
    Page<ViewLog> findByUser_IdOrderByWatchedAtDesc(@Param("userId") Integer userId, Pageable pageable);

    Optional<ViewLog> findTopByUser_IdAndTmdb_IdOrderByWatchedAtDesc(Integer userId, Integer movieId);

    boolean existsByUser_IdAndTmdb_Id(Integer userId, Integer movieId);
}
