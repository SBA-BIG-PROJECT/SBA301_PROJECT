package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to create a new category
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateCategoryRequest {
    
    @NotBlank(message = "Category ID is required")
    @Size(max = 50, message = "Category ID must not exceed 50 characters")
    private String categoryId;
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;
}
