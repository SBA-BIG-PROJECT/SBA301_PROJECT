package be.backend.controller;

import be.backend.model.dto.CategoryDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateCategoryRequest;
import be.backend.model.request.CreateGenreRequest;
import be.backend.model.response.MessageResponse;
import be.backend.services.AdminGenreCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin Genre & Category Management Controller
 * 
 * Authorization: Requires ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGenreCategoryController {

    private final AdminGenreCategoryService adminGenreCategoryService;

    // ============= GENRE ENDPOINTS =============
    
    /**
     * Get all genres
     * GET /api/v1/admin/genres
     */
    @GetMapping("/genres")
    public ResponseEntity<List<GenreDto>> getAllGenres() {
        return ResponseEntity.ok(adminGenreCategoryService.getAllGenres());
    }

    /**
     * Create new genre
     * POST /api/v1/admin/genres
     */
    @PostMapping("/genres")
    public ResponseEntity<GenreDto> createGenre(@Valid @RequestBody CreateGenreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminGenreCategoryService.createGenre(request));
    }

    /**
     * Update genre
     * PUT /api/v1/admin/genres/{genreId}?newName=Updated Genre
     */
    @PutMapping("/genres/{genreId}")
    public ResponseEntity<GenreDto> updateGenre(
            @PathVariable Integer genreId,
            @RequestParam String newName) {
        
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("newName is required");
        }
        
        return ResponseEntity.ok(adminGenreCategoryService.updateGenre(genreId, newName));
    }

    /**
     * Delete genre
     * DELETE /api/v1/admin/genres/{genreId}
     */
    @DeleteMapping("/genres/{genreId}")
    public ResponseEntity<MessageResponse> deleteGenre(@PathVariable Integer genreId) {
        adminGenreCategoryService.deleteGenre(genreId);
        return ResponseEntity.ok(MessageResponse.of("Genre deleted successfully"));
    }

    // ============= CATEGORY ENDPOINTS =============
    
    /**
     * Get all categories
     * GET /api/v1/admin/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(adminGenreCategoryService.getAllCategories());
    }

    /**
     * Create new category
     * POST /api/v1/admin/categories
     */
    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminGenreCategoryService.createCategory(request));
    }

    /**
     * Update category
     * PUT /api/v1/admin/categories/{categoryId}?newName=Updated Category
     */
    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable String categoryId,
            @RequestParam String newName) {
        
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("newName is required");
        }
        
        return ResponseEntity.ok(adminGenreCategoryService.updateCategory(categoryId, newName));
    }

    /**
     * Delete category
     * DELETE /api/v1/admin/categories/{categoryId}
     */
    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<MessageResponse> deleteCategory(@PathVariable String categoryId) {
        adminGenreCategoryService.deleteCategory(categoryId);
        return ResponseEntity.ok(MessageResponse.of("Category deleted successfully"));
    }
}
