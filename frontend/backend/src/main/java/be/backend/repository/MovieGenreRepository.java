package be.backend.repository;

import be.backend.entity.Movie;
import be.backend.entity.MovieGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MovieGenreRepository extends JpaRepository<MovieGenre, Integer> {
    List<MovieGenre> findByTmdb_Id(Integer tmdbId);
    List<MovieGenre> findByGenre_Id(Integer genreId);
    
    @Transactional
    @Modifying
    void deleteByTmdb_Id(Integer tmdbId);
    
    @Transactional
    @Modifying
    void deleteByTmdb(Movie movie);
}
