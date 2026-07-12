package be.backend.services;

import be.backend.model.dto.AiMovieDto;
import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MovieSearchService {

    Page<AiMovieDto> searchMovies(MovieSearchCriteria criteria);

}