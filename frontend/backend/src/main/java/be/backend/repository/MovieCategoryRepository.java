package be.backend.repository;

import be.backend.entity.Movie;
import be.backend.entity.MovieCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MovieCategoryRepository extends JpaRepository<MovieCategory, Integer> {
    List<MovieCategory> findByTmdb_Id(Integer tmdbId);

    @Modifying
    @Query("DELETE FROM MovieCategory mc WHERE mc.tmdb.id = :movieId")
    void deleteByMovieId(@Param("movieId") Integer movieId);
}
