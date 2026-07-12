package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.model.dto.AiMovieDto;
import be.backend.model.dto.MovieSearchCriteria;
import be.backend.repository.MovieRepository;
import be.backend.services.MovieSearchService;
import be.backend.specification.MovieSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieSearchServiceImpl implements MovieSearchService {

    private final MovieRepository movieRepository;

    @Override
    public Page<AiMovieDto> searchMovies(
            MovieSearchCriteria criteria) {

        Pageable pageable =
                PageRequest.of(
                        criteria.getPage(),
                        criteria.getSize());

        Page<Movie> page =
                movieRepository.findAll(
                        MovieSpecification.search(criteria),
                        pageable);

        return page.map(this::toAiMovieDto);
    }

    private AiMovieDto toAiMovieDto(
            Movie movie) {

        AiMovieDto dto =
                new AiMovieDto();

        dto.setId(movie.getId());

        dto.setTitle(movie.getTitle());

        dto.setPosterPath(movie.getPosterPath());

        dto.setOverview(movie.getOverview());

        dto.setReleaseDate(movie.getReleaseDate());

        dto.setVoteAverage(movie.getVoteAverage());

        dto.setVoteCount(movie.getVoteCount());

        dto.setPremium(movie.getIsPremium());

        dto.setGenres(
                movie.getMovieGenres()
                        .stream()
                        .map(g -> g.getGenre().getName())
                        .toList());

        dto.setCategories(
                movie.getMovieCategories()
                        .stream()
                        .map(c -> c.getCategory().getName())
                        .toList());

        dto.setActors(
                movie.getMoviePeople()
                        .stream()
                        .filter(mp ->
                                "ACTOR".equalsIgnoreCase(mp.getRole()))
                        .map(mp ->
                                mp.getPerson().getName())
                        .distinct()
                        .toList());

        dto.setDirectors(
                movie.getMoviePeople()
                        .stream()
                        .filter(mp ->
                                "DIRECTOR".equalsIgnoreCase(mp.getRole()))
                        .map(mp ->
                                mp.getPerson().getName())
                        .distinct()
                        .toList());

        return dto;
    }

}