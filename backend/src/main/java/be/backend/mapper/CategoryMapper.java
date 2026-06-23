package be.backend.mapper;

import be.backend.entity.Category;
import be.backend.model.dto.CategoryDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryDto toDto(Category category);
}
