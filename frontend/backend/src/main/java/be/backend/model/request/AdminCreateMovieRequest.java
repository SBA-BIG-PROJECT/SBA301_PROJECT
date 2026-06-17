package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request to create a new movie by admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateMovieRequest {
    
    @NotNull(message = "TMDB ID is required")
    private Integer tmdbId;
    
    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;
    
    private String overview;
    
    @Size(max = 500, message = "Poster path must not exceed 500 characters")
    private String posterPath;
    
    @Size(max = 500, message = "Backdrop path must not exceed 500 characters")
    private String backdropPath;
    
    private LocalDate releaseDate;
    
    private Double voteAverage;
    
    private Integer voteCount;
    
    @Size(max = 500, message = "Trailer URL must not exceed 500 characters")
    private String trailerUrl;
    
    private List<Integer> genreIds;
    
    private List<String> categoryIds;
}
