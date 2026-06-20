package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.MovieMapper;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.dto.TrendingMovieDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.repository.ViewLogRepository;
import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;
    private final MovieMapper movieMapper;
    private final ViewLogRepository viewLogRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieDto> getMovies(int page, int size, String search, Integer genreId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("addedAt").descending());

        Page<Movie> result;
        if (genreId != null) {
            result = movieRepository.findActiveByGenre(genreId, pageable);
        } else if (search != null && !search.isBlank()) {
            result = movieRepository.searchByKeyword(search.trim(), pageable);
        } else {
            result = movieRepository.findByIsActiveTrue(pageable);
        }

        return PageResponse.from(result.map(movieMapper::toDto));
    }
    @Override
    @Transactional(readOnly = true)
    public MovieDetailDto getMovieDetail(Integer id) {
        Movie movie = movieRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim id=" + id));
        return movieMapper.toDetailDto(movie);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TrendingMovieDto> getTrendingMovies(
            int page,
            int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        Instant fromDate =
                Instant.now().minus(7, ChronoUnit.DAYS);

        Page<Integer> movieIds =
                viewLogRepository.findTrendingMovieIds(
                        fromDate,
                        pageable
                );

        List<TrendingMovieDto> content =
                movieIds.getContent()
                        .stream()
                        .map(movieRepository::findById)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .map(this::toTrendingDto)
                        .toList();

        return PageResponse.from(
                new PageImpl<>(
                        content,
                        pageable,
                        movieIds.getTotalElements()
                )
        );
    }

    private TrendingMovieDto toTrendingDto(Movie movie) {

        TrendingMovieDto dto = new TrendingMovieDto();

        dto.setMovieId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setPosterPath(movie.getPosterPath());
        dto.setVoteAverage(movie.getVoteAverage());
        dto.setReleaseDate(movie.getReleaseDate());

        return dto;
    }
}