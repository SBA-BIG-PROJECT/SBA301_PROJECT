package be.backend.repository;

import be.backend.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonRepository
        extends JpaRepository<Person, Integer> {

    Optional<Person> findFirstByNameIgnoreCase(String name);

    List<Person> findTop5ByNameContainingIgnoreCase(
            String name
    );
}
