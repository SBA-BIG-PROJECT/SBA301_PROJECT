package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
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

    @Size(max = 500)
    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;


    @Column(name = "overview")
    private String overview;

    @Size(max = 500)
    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Size(max = 500)
    @Column(name = "backdrop_path", length = 500)
    private String backdropPath;

    @Column(name = "release_date")
    private Instant releaseDate;

    @Column(name = "vote_average")
    private Double voteAverage;

    @Column(name = "vote_count")
    private Integer voteCount;

    @Size(max = 500)
    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "added_at", nullable = false)
    private Instant addedAt;

    @NotNull
    @ColumnDefault("1")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "is_premium", nullable = false)
    private Boolean isPremium = false;

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