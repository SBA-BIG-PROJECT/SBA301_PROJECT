package be.backend.model.request;

    import jakarta.validation.constraints.Size;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    import java.time.Instant;
    import java.time.LocalDateTime;
    import java.util.List;

    /**
     * Request to update movie by admin
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class AdminUpdateMovieRequest {
        
        @Size(max = 500, message = "Title must not exceed 500 characters")
        private String title;
        
        private String overview;
        
        @Size(max = 500, message = "Poster path must not exceed 500 characters")
        private String posterPath;
        
        @Size(max = 500, message = "Backdrop path must not exceed 500 characters")
        private String backdropPath;
        
        private Instant releaseDate;
        
        @Size(max = 500, message = "Trailer URL must not exceed 500 characters")
        private String trailerUrl;
        
        private List<Integer> genreIds;
        
        private Boolean isActive;
    }
