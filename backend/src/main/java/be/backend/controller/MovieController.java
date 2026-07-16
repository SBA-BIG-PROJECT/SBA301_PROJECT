package be.backend.controller;

import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.dto.TrendingMovieDto;
import be.backend.model.request.AdminCreateMovieRequest;
import be.backend.model.request.AdminUpdateMovieRequest;
import be.backend.model.response.MessageResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.FileStorageService;
import be.backend.services.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;
    private final FileStorageService fileStorageService;

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

    @GetMapping("/trending")
    public ResponseEntity<PageResponse<TrendingMovieDto>> getTrendingMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(movieService.getTrendingMovies(page, size));
    }

    // --- Admin Methods ---

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (!fileStorageService.isValidImage(file)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid image file"));
            }
            Map<String, String> result = fileStorageService.uploadImage(file, "movies");
            return ResponseEntity.ok(Map.of("url", result.get("url")));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to upload image"));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<PageResponse<AdminMovieDto>> getAllMoviesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        
        return ResponseEntity.ok(
                movieService.getAllMoviesAdmin(page, size, search, isActive)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/{tmdbId}")
    public ResponseEntity<AdminMovieDto> getMovieDetailAdmin(@PathVariable Integer tmdbId) {
        return ResponseEntity.ok(movieService.getMovieDetailAdmin(tmdbId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<AdminMovieDto> createMovie(
            @Valid @RequestBody AdminCreateMovieRequest request) {
        
        AdminMovieDto createdMovie = movieService.createMovie(request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMovie);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{tmdbId}")
    public ResponseEntity<AdminMovieDto> updateMovie(
            @PathVariable Integer tmdbId,
            @Valid @RequestBody AdminUpdateMovieRequest request) {
        
        return ResponseEntity.ok(movieService.updateMovie(tmdbId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{tmdbId}")
    public ResponseEntity<MessageResponse> deleteMovie(@PathVariable Integer tmdbId) {
        movieService.deleteMovie(tmdbId);
        return ResponseEntity.ok(MessageResponse.of("Movie deleted successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{tmdbId}/restore")
    public ResponseEntity<AdminMovieDto> restoreMovie(@PathVariable Integer tmdbId) {
        return ResponseEntity.ok(movieService.restoreMovie(tmdbId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{tmdbId}/genres")
    public ResponseEntity<AdminMovieDto> updateMovieGenres(
            @PathVariable Integer tmdbId,
            @RequestBody Map<String, List<Integer>> request) {
        
        List<Integer> genreIds = request.get("genreIds");
        if (genreIds == null || genreIds.isEmpty()) {
            throw new IllegalArgumentException("genreIds is required and cannot be empty");
        }
        
        return ResponseEntity.ok(movieService.updateMovieGenres(tmdbId, genreIds));
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/{tmdbId}/premium")
    public ResponseEntity<AdminMovieDto> setMoviePremium(
            @PathVariable Integer tmdbId,
            @RequestParam boolean isPremium) {
        return ResponseEntity.ok(movieService.setMoviePremium(tmdbId, isPremium));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/diagnose")
    public ResponseEntity<List<Map<String, Object>>> diagnoseAllMovies() {
        return ResponseEntity.ok(movieService.diagnoseAllMovies());
    }
}