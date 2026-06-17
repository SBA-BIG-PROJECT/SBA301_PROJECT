package be.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "person")
public class Person {
    @Id
    @Column(name = "person_id", nullable = false)
    private Integer id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "profile_path", length = 500)
    private String profilePath;

    @OneToMany
    @JoinColumn(name = "person_id")
    private Set<MoviePerson> moviePeople = new LinkedHashSet<>();

}