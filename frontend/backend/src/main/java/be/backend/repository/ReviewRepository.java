package be.backend.repository;

import be.backend.entity.Review;
import be.backend.model.dto.RatingSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Page<Review> findByTmdb_IdOrderByCreatedAtDesc(Integer movieId, Pageable pageable);

    boolean existsByTmdb_IdAndUser_Id(Integer movieId, Integer userId);

    @Query("SELECT new be.backend.model.dto.RatingSummaryDto(AVG(r.rating), COUNT(r)) " +
            "FROM Review r WHERE r.tmdb.id = :movieId")
    RatingSummaryDto getRatingSummary(@Param("movieId") Integer movieId);

    List<Review> findByUser_IdAndRatingGreaterThanEqual(
            Integer userId,
            BigDecimal rating
    );
}