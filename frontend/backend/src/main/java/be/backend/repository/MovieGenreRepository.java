package be.backend.repository;

import be.backend.entity.MovieGenre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieGenreRepository extends JpaRepository<MovieGenre, Integer> {
    List<MovieGenre> findByTmdb_Id(Integer tmdbId);

    List<MovieGenre> findByGenre_Id(Integer genreId);
}
