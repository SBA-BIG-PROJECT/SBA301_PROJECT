package be.backend.repository;

import be.backend.entity.MovieGenre;
import be.backend.entity.Recommendation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Integer> {
    Page<Recommendation> findByUser_IdOrderByCreatedAtDesc(
            Integer userId,
            Pageable pageable
    );

    boolean existsByUser_IdAndTmdb_Id(
            Integer userId,
            Integer tmdbId
    );

    List<Recommendation> findByUser_Id(Integer userId);

    void deleteByUser_Id(Integer userId);
}

