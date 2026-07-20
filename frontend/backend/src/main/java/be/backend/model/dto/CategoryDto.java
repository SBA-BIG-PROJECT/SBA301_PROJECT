package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Category DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private String categoryId;
    private String name;
}
