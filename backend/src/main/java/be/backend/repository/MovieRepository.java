package be.backend.repository;

import be.backend.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Integer> {

    Page<Movie> findByIsActiveTrue(Pageable pageable);

    Page<Movie> findByIsActiveTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);
}