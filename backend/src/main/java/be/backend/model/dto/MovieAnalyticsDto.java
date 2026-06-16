package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Movie analytics data for admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieAnalyticsDto {
    private List<TopMovieDto> mostViewedMovies;
    private List<TopMovieDto> highestRatedMovies;
    private List<TopMovieDto> mostWatchlistedMovies;
    private List<GenrePopularityDto> popularGenres;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopMovieDto {
        private Integer tmdbId;
        private String title;
        private String posterPath;
        private Long count;
        private Double rating;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenrePopularityDto {
        private Integer genreId;
        private String genreName;
        private Long movieCount;
        private Long viewCount;
        private Double averageRating;
    }
}
