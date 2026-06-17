package be.backend.controller;

import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.response.PageResponse;
import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public ResponseEntity<PageResponse<MovieDto>> getMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer genreId) {
        return ResponseEntity.ok(movieService.getMovies(page, size, search,genreId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieDetailDto> getMovieDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(movieService.getMovieDetail(id));
    }
}