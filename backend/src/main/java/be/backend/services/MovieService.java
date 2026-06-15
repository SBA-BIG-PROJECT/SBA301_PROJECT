package be.backend.services;

import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.response.PageResponse;

public interface MovieService {
    PageResponse<MovieDto> getMovies(int page, int size, String search, Integer genreId);
    MovieDetailDto getMovieDetail(Integer id);
}