package be.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "movie")
public class Movie {
    @Id
    @Column(name = "tmdb_id", nullable = false)
    private Integer id;

    @Column(name = "title", nullable = false, length = 500)
    private String title;


    @Column(name = "overview")
    private String overview;

    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(name = "backdrop_path", length = 500)
    private String backdropPath;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "vote_average")
    private Double voteAverage;

    @Column(name = "vote_count")
    private Integer voteCount;

    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @ColumnDefault("1")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<MovieCategory> movieCategories = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<MovieGenre> movieGenres = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<MoviePerson> moviePeople = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<Recommendation> recommendations = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<Review> reviews = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<ViewLog> viewLogs = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "tmdb_id")
    private Set<Watchlist> watchlists = new LinkedHashSet<>();

}