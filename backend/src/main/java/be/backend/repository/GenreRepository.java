package be.backend.repository;

import be.backend.entity.Genre;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface GenreRepository extends JpaRepository<Genre,Integer> {
    @Query("""
        SELECT g.id, g.name, COUNT(mg.id) as movieCount
        FROM Genre g
        JOIN MovieGenre mg ON mg.genre.id = g.id
        GROUP BY g.id, g.name
        ORDER BY movieCount DESC
    """)
    List<Object[]> findPopularGenres(Pageable pageable);
}
