package be.backend.repository;

import be.backend.entity.MoviePerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoviePersonRepository extends JpaRepository<MoviePerson, Integer> {

    List<MoviePerson> findByTmdb_Id(Integer movieId);

    @Query("""
    select mp
    from MoviePerson mp
    where mp.person.id in :personIds
""")
    List<MoviePerson> findByPersonIds(
            @Param("personIds") List<Integer> personIds
    );
}
