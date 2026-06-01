package be.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "category")
public class Category {
    @Id
    @Column(name = "category_id", nullable = false, length = 50)
    private String categoryId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @OneToMany
    @JoinColumn(name = "category_id")
    private Set<MovieCategory> movieCategories = new LinkedHashSet<>();

}