package be.backend.services;

import be.backend.model.dto.AdminMovieDto;
import be.backend.model.request.AdminCreateMovieRequest;
import be.backend.model.request.AdminUpdateMovieRequest;
import be.backend.model.response.PageResponse;

import java.util.List;

/**
 * Admin Movie Service
 * Provides movie management operations for administrators
 */
public interface AdminMovieService {
    
    /**
     * Get all movies with filters and pagination
     */
    PageResponse<AdminMovieDto> getAllMovies(int page, int size, String search, Boolean isActive);
    
    /**
     * Get detailed movie information
     */
    AdminMovieDto getMovieDetail(Integer tmdbId);
    
    /**
     * Create new movie
     */
    AdminMovieDto createMovie(AdminCreateMovieRequest request);
    
    /**
     * Update movie information
     */
    AdminMovieDto updateMovie(Integer tmdbId, AdminUpdateMovieRequest request);
    
    /**
     * Soft delete movie (set isActive = false)
     */
    void deleteMovie(Integer tmdbId);
    
    /**
     * Restore movie (set isActive = true)
     */
    AdminMovieDto restoreMovie(Integer tmdbId);
    
    /**
     * Update movie genres
     */
    AdminMovieDto updateMovieGenres(Integer tmdbId, List<Integer> genreIds);
    
    /**
     * Update movie categories
     */
    AdminMovieDto updateMovieCategories(Integer tmdbId, List<String> categoryIds);
}
