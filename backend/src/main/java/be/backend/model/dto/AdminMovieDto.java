package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Admin view of movie data with additional statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminMovieDto {
    private Integer tmdbId;
    private String title;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private LocalDate releaseDate;
    private Double voteAverage;
    private Integer voteCount;
    private String trailerUrl;
    private Integer addedBy;
    private String addedByName;
    private Instant addedAt;
    private Boolean isActive;
    
    // Genres and categories
    private List<GenreDto> genres;
    private List<String> categories;
    
    // Statistics
    private Long totalViews;
    private Long totalReviews;
    private Long totalWatchlist;
    private Double averageRating;
}
