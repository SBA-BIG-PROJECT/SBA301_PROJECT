package be.backend.mapper;

import be.backend.entity.ViewLog;
import be.backend.model.dto.ViewHistoryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ViewLogMapper {
    @Mapping(target = "movieId", source = "tmdb.id")
    @Mapping(target = "movieTitle", source = "tmdb.title")
    @Mapping(target = "posterPath", source = "tmdb.posterPath")
    @Mapping(target = "overview", source = "tmdb.overview")
    @Mapping(target = "releaseDate", source = "tmdb.releaseDate")
    @Mapping(target = "voteAverage", source = "tmdb.voteAverage")
    @Mapping(target = "voteCount", source = "tmdb.voteCount")
    ViewHistoryDto toDto(ViewLog viewLog);
}
