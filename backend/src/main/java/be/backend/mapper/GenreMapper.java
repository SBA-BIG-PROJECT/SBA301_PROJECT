package be.backend.mapper;

import be.backend.entity.Genre;
import be.backend.model.dto.GenreDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GenreMapper {
    GenreDto toDto(Genre genre);
}
