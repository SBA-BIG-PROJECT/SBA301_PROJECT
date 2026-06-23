package be.backend.mapper;

import be.backend.entity.Watchlist;
import be.backend.model.dto.WatchlistDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WatchlistMapper {
    @Mapping(target = "movieId", source = "tmdb.id")
    @Mapping(target = "movieTitle", source = "tmdb.title")
    @Mapping(target = "posterPath", source = "tmdb.posterPath")
    @Mapping(target = "releaseDate", source = "tmdb.releaseDate")
    @Mapping(target = "voteAverage", source = "tmdb.voteAverage")
    @Mapping(target = "voteCount", source = "tmdb.voteCount")
    WatchlistDto toDto(Watchlist watchlist);
}
