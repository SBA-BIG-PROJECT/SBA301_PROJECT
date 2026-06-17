package be.backend.services;

import be.backend.model.dto.CategoryDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateCategoryRequest;
import be.backend.model.request.CreateGenreRequest;

import java.util.List;

/**
 * Admin Genre and Category Service
 * Provides genre and category management operations for administrators
 */
public interface AdminGenreCategoryService {
    
    // Genre operations
    List<GenreDto> getAllGenres();
    GenreDto createGenre(CreateGenreRequest request);
    GenreDto updateGenre(Integer genreId, String newName);
    void deleteGenre(Integer genreId);
    
    // Category operations
    List<CategoryDto> getAllCategories();
    CategoryDto createCategory(CreateCategoryRequest request);
    CategoryDto updateCategory(String categoryId, String newName);
    void deleteCategory(String categoryId);
}
