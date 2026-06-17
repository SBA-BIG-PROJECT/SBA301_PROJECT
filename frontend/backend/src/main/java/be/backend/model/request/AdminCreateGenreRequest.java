package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to create a new genre
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateGenreRequest {
    
    @NotNull(message = "Genre ID is required")
    private Integer genreId;
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;
}
