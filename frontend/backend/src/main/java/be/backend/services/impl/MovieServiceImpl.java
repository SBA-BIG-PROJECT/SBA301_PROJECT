package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.MovieMapper;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;
    private final MovieMapper movieMapper;

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
}