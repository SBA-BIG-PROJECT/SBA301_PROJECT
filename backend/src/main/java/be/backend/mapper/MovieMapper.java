package be.backend.mapper;

import be.backend.entity.Movie;
import be.backend.entity.MovieGenre;
import be.backend.entity.MoviePerson;
import be.backend.model.dto.CastMemberDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MovieMapper {

    // dùng cho danh sách
    MovieDto toDto(Movie movie);

    // dùng cho chi tiết — MapStruct tự map Set -> List qua 2 method bên dưới
    @Mapping(target = "genres", source = "movieGenres")
    @Mapping(target = "cast", source = "moviePeople")
    MovieDetailDto toDetailDto(Movie movie);

    @Mapping(target = "id", source = "genre.id")
    @Mapping(target = "name", source = "genre.name")
    GenreDto toGenreDto(MovieGenre movieGenre);

    @Mapping(target = "personId", source = "person.id")
    @Mapping(target = "name", source = "person.name")
    @Mapping(target = "profilePath", source = "person.profilePath")
    CastMemberDto toCastMemberDto(MoviePerson moviePerson);
}