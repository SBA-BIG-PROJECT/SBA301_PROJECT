package be.backend.services;

import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.dto.TrendingMovieDto;
import be.backend.model.request.AdminCreateMovieRequest;
import be.backend.model.request.AdminUpdateMovieRequest;
import be.backend.model.response.PageResponse;

import java.util.List;

public interface MovieService {
    PageResponse<MovieDto> getMovies(int page, int size, String search, Integer genreId);
    MovieDetailDto getMovieDetail(Integer id);
    PageResponse<TrendingMovieDto> getTrendingMovies(int page, int size);
    
    // --- Admin Methods ---
    PageResponse<AdminMovieDto> getAllMoviesAdmin(int page, int size, String search, Boolean isActive);
    AdminMovieDto getMovieDetailAdmin(Integer tmdbId);
    AdminMovieDto createMovie(AdminCreateMovieRequest request);
    AdminMovieDto updateMovie(Integer tmdbId, AdminUpdateMovieRequest request);
    void deleteMovie(Integer tmdbId);
    AdminMovieDto restoreMovie(Integer tmdbId);
    AdminMovieDto updateMovieGenres(Integer tmdbId, List<Integer> genreIds);
    AdminMovieDto setMoviePremium(Integer tmdbId, boolean isPremium);
    void refreshAllMovieCategories();
    void refreshMovieCategories(Integer tmdbId);
    String resolveEmbedUrl(String playToken);
    java.util.List<java.util.Map<String, Object>> diagnoseAllMovies();
}