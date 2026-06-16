package be.backend.controller;

import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.request.AdminCreateMovieRequest;
import be.backend.model.request.AdminUpdateMovieRequest;
import be.backend.model.response.MessageResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.AdminMovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin Movie Management Controller
 * Handles all admin operations related to movie management
 * 
 * Authorization: Requires ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin/movies")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMovieController {

    private final AdminMovieService adminMovieService;

    /**
     * Get all movies (including inactive) with filters
     * GET /api/v1/admin/movies?page=0&size=20&search=avengers&isActive=true
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminMovieDto>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        
        return ResponseEntity.ok(
                adminMovieService.getAllMovies(page, size, search, isActive)
        );
    }

    /**
     * Get movie detail (admin view)
     * GET /api/v1/admin/movies/{tmdbId}
     */
    @GetMapping("/{tmdbId}")
    public ResponseEntity<AdminMovieDto> getMovieDetail(@PathVariable Integer tmdbId) {
        return ResponseEntity.ok(adminMovieService.getMovieDetail(tmdbId));
    }

    /**
     * Create new movie
     * POST /api/v1/admin/movies
     */
    @PostMapping
    public ResponseEntity<AdminMovieDto> createMovie(
            @Valid @RequestBody AdminCreateMovieRequest request) {
        
        AdminMovieDto createdMovie = adminMovieService.createMovie(request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMovie);
    }

    /**
     * Update movie information
     * PUT /api/v1/admin/movies/{tmdbId}
     */
    @PutMapping("/{tmdbId}")
    public ResponseEntity<AdminMovieDto> updateMovie(
            @PathVariable Integer tmdbId,
            @Valid @RequestBody AdminUpdateMovieRequest request) {
        
        return ResponseEntity.ok(adminMovieService.updateMovie(tmdbId, request));
    }

    /**
     * Delete movie (soft delete)
     * DELETE /api/v1/admin/movies/{tmdbId}
     */
    @DeleteMapping("/{tmdbId}")
    public ResponseEntity<MessageResponse> deleteMovie(@PathVariable Integer tmdbId) {
        adminMovieService.deleteMovie(tmdbId);
        return ResponseEntity.ok(MessageResponse.of("Movie deleted successfully"));
    }

    /**
     * Restore deleted movie
     * POST /api/v1/admin/movies/{tmdbId}/restore
     */
    @PostMapping("/{tmdbId}/restore")
    public ResponseEntity<AdminMovieDto> restoreMovie(@PathVariable Integer tmdbId) {
        return ResponseEntity.ok(adminMovieService.restoreMovie(tmdbId));
    }

    /**
     * Update movie genres
     * PUT /api/v1/admin/movies/{tmdbId}/genres
     */
    @PutMapping("/{tmdbId}/genres")
    public ResponseEntity<AdminMovieDto> updateMovieGenres(
            @PathVariable Integer tmdbId,
            @RequestBody Map<String, List<Integer>> request) {
        
        List<Integer> genreIds = request.get("genreIds");
        if (genreIds == null || genreIds.isEmpty()) {
            throw new IllegalArgumentException("genreIds is required and cannot be empty");
        }
        
        return ResponseEntity.ok(adminMovieService.updateMovieGenres(tmdbId, genreIds));
    }

    /**
     * Update movie categories
     * PUT /api/v1/admin/movies/{tmdbId}/categories
     */
    @PutMapping("/{tmdbId}/categories")
    public ResponseEntity<AdminMovieDto> updateMovieCategories(
            @PathVariable Integer tmdbId,
            @RequestBody Map<String, List<String>> request) {
        
        List<String> categoryIds = request.get("categoryIds");
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new IllegalArgumentException("categoryIds is required and cannot be empty");
        }
        
        return ResponseEntity.ok(adminMovieService.updateMovieCategories(tmdbId, categoryIds));
    }

    private String extractEmail(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        throw new IllegalStateException("User not authenticated");
    }
}
