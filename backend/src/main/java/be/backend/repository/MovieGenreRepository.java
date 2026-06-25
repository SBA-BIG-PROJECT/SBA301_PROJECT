package be.backend.repository;

import be.backend.entity.MovieGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieGenreRepository extends JpaRepository<MovieGenre, Integer> {
    List<MovieGenre> findByTmdb_Id(Integer tmdbId);
    List<MovieGenre> findByGenre_Id(Integer genreId);

    @Modifying
    @Query("DELETE FROM MovieGenre mg WHERE mg.tmdb.id = :movieId")
    void deleteByMovieId(@Param("movieId") Integer movieId);
}
