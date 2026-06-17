package be.backend.services.impl;

import be.backend.entity.Category;
import be.backend.entity.Genre;
import be.backend.entity.Movie;
import be.backend.entity.MovieCategory;
import be.backend.entity.MovieGenre;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.request.AdminCreateMovieRequest;
import be.backend.model.request.AdminUpdateMovieRequest;
import be.backend.model.response.PageResponse;
import be.backend.repository.CategoryRepository;
import be.backend.repository.GenreRepository;
import be.backend.repository.MovieCategoryRepository;
import be.backend.repository.MovieGenreRepository;
import be.backend.repository.MovieRepository;
import be.backend.repository.ReviewRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.ViewLogRepository;
import be.backend.repository.WatchlistRepository;
import be.backend.services.AdminMovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Movie Service Implementation
 * Handles all admin operations related to movie management
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminMovieServiceImpl implements AdminMovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final CategoryRepository categoryRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieCategoryRepository movieCategoryRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;
    private final ViewLogRepository viewLogRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminMovieDto> getAllMovies(int page, int size, String search, Boolean isActive) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "addedAt"));
        
        Page<Movie> moviePage;
        if (search != null && !search.trim().isEmpty()) {
            moviePage = movieRepository.searchByKeyword(search, pageable);
        } else if (isActive != null) {
            moviePage = isActive 
                ? movieRepository.findByIsActiveTrue(pageable)
                : movieRepository.findAll(pageable);
        } else {
            moviePage = movieRepository.findAll(pageable);
        }
        
        Page<AdminMovieDto> dtoPage = moviePage.map(this::toAdminMovieDto);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMovieDto getMovieDetail(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        return toAdminMovieDto(movie);
    }

    @Override
    public AdminMovieDto createMovie(AdminCreateMovieRequest request) {
        // Check if movie already exists
        if (movieRepository.existsById(request.getTmdbId())) {
            throw new IllegalArgumentException("Movie with TMDB ID " + request.getTmdbId() + " already exists");
        }
        
        Movie movie = new Movie();
        movie.setId(request.getTmdbId());
        movie.setTitle(request.getTitle());
        movie.setOverview(request.getOverview());
        movie.setPosterPath(request.getPosterPath());
        movie.setBackdropPath(request.getBackdropPath());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setVoteAverage(request.getVoteAverage());
        movie.setVoteCount(request.getVoteCount());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setIsActive(true);
        movie.setAddedAt(Instant.now());
        
        // Set current admin as added_by
        User currentAdmin = getCurrentAdmin();
        movie.setAddedBy(currentAdmin);
        
        Movie savedMovie = movieRepository.save(movie);
        
        // Add genres
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            addGenresToMovie(savedMovie, request.getGenreIds());
        }
        
        // Add categories
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            addCategoriesToMovie(savedMovie, request.getCategoryIds());
        }
        
        log.info("Admin created movie: {} ({})", savedMovie.getTitle(), savedMovie.getId());
        return toAdminMovieDto(savedMovie);
    }

    @Override
    public AdminMovieDto updateMovie(Integer tmdbId, AdminUpdateMovieRequest request) {
        Movie movie = findMovieById(tmdbId);
        
        if (request.getTitle() != null) {
            movie.setTitle(request.getTitle());
        }
        if (request.getOverview() != null) {
            movie.setOverview(request.getOverview());
        }
        if (request.getPosterPath() != null) {
            movie.setPosterPath(request.getPosterPath());
        }
        if (request.getBackdropPath() != null) {
            movie.setBackdropPath(request.getBackdropPath());
        }
        if (request.getReleaseDate() != null) {
            movie.setReleaseDate(request.getReleaseDate());
        }
        if (request.getVoteAverage() != null) {
            movie.setVoteAverage(request.getVoteAverage());
        }
        if (request.getVoteCount() != null) {
            movie.setVoteCount(request.getVoteCount());
        }
        if (request.getTrailerUrl() != null) {
            movie.setTrailerUrl(request.getTrailerUrl());
        }
        if (request.getIsActive() != null) {
            movie.setIsActive(request.getIsActive());
        }
        
        Movie updatedMovie = movieRepository.save(movie);
        
        // Update genres if provided
        if (request.getGenreIds() != null) {
            movieGenreRepository.deleteByTmdb(movie);
            addGenresToMovie(movie, request.getGenreIds());
        }
        
        // Update categories if provided
        if (request.getCategoryIds() != null) {
            movieCategoryRepository.deleteByTmdb(movie);
            addCategoriesToMovie(movie, request.getCategoryIds());
        }
        
        log.info("Admin updated movie: {} ({})", updatedMovie.getTitle(), updatedMovie.getId());
        return toAdminMovieDto(updatedMovie);
    }

    @Override
    public void deleteMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(false);
        movieRepository.save(movie);
        
        log.info("Admin deactivated movie: {} ({})", movie.getTitle(), movie.getId());
    }

    @Override
    public AdminMovieDto restoreMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(true);
        Movie restored = movieRepository.save(movie);
        
        log.info("Admin restored movie: {} ({})", movie.getTitle(), movie.getId());
        return toAdminMovieDto(restored);
    }

    /**
     * Convert Movie entity to AdminMovieDto
     */
    private AdminMovieDto toAdminMovieDto(Movie movie) {
        AdminMovieDto dto = new AdminMovieDto();
        dto.setTmdbId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setOverview(movie.getOverview());
        dto.setPosterPath(movie.getPosterPath());
        dto.setBackdropPath(movie.getBackdropPath());
        dto.setReleaseDate(movie.getReleaseDate());
        dto.setVoteAverage(movie.getVoteAverage());
        dto.setVoteCount(movie.getVoteCount());
        dto.setTrailerUrl(movie.getTrailerUrl());
        dto.setAddedAt(movie.getAddedAt());
        dto.setIsActive(movie.getIsActive());
        
        if (movie.getAddedBy() != null) {
            dto.setAddedBy(movie.getAddedBy().getId());
            dto.setAddedByName(movie.getAddedBy().getFullName());
        }
        
        // Get genres
        List<GenreDto> genres = movie.getMovieGenres().stream()
            .map(mg -> new GenreDto(mg.getGenre().getId(), mg.getGenre().getName()))
            .collect(Collectors.toList());
        dto.setGenres(genres);
        
        // Get categories
        List<String> categories = movie.getMovieCategories().stream()
            .map(mc -> mc.getCategory().getName())
            .collect(Collectors.toList());
        dto.setCategories(categories);
        
        // Statistics
        dto.setTotalViews((long) movie.getViewLogs().size());
        dto.setTotalReviews((long) movie.getReviews().size());
        dto.setTotalWatchlist((long) movie.getWatchlists().size());
        
        // Average rating from our system
        if (!movie.getReviews().isEmpty()) {
            double avgRating = movie.getReviews().stream()
                .mapToDouble(r -> r.getRating().doubleValue())
                .average()
                .orElse(0.0);
            dto.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
        }
        
        return dto;
    }

    /**
     * Add genres to movie
     */
    private void addGenresToMovie(Movie movie, List<Integer> genreIds) {
        for (Integer genreId : genreIds) {
            Genre genre = genreRepository.findById(genreId)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
            
            MovieGenre movieGenre = new MovieGenre();
            movieGenre.setTmdb(movie);
            movieGenre.setGenre(genre);
            movieGenreRepository.save(movieGenre);
        }
    }

    /**
     * Add categories to movie
     */
    private void addCategoriesToMovie(Movie movie, List<String> categoryIds) {
        for (String categoryId : categoryIds) {
            Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
            
            MovieCategory movieCategory = new MovieCategory();
            movieCategory.setTmdb(movie);
            movieCategory.setCategory(category);
            movieCategoryRepository.save(movieCategory);
        }
    }

    /**
     * Find movie by ID or throw exception
     */
    private Movie findMovieById(Integer tmdbId) {
        return movieRepository.findById(tmdbId)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + tmdbId));
    }

    /**
     * Get current authenticated admin user
     */
    private User getCurrentAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Admin user not found"));
        }
        throw new IllegalStateException("No authenticated admin");
    }

    @Override
    public AdminMovieDto updateMovieGenres(Integer tmdbId, List<Integer> genreIds) {
        Movie movie = findMovieById(tmdbId);
        
        // Remove existing genres
        movieGenreRepository.deleteByTmdb(movie);
        movieGenreRepository.flush(); // Force delete to execute immediately
        
        // Clear the collection to avoid stale references
        movie.getMovieGenres().clear();
        
        // Add new genres
        addGenresToMovie(movie, genreIds);
        
        // Refresh movie to get updated genre list
        movie = movieRepository.findById(tmdbId)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + tmdbId));
        
        log.info("Admin updated genres for movie: {}", tmdbId);
        return toAdminMovieDto(movie);
    }

    @Override
    public AdminMovieDto updateMovieCategories(Integer tmdbId, List<String> categoryIds) {
        Movie movie = findMovieById(tmdbId);
        
        // Remove existing categories
        movieCategoryRepository.deleteByTmdb(movie);
        movieCategoryRepository.flush(); // Force delete to execute immediately
        
        // Clear the collection to avoid stale references
        movie.getMovieCategories().clear();
        
        // Add new categories
        addCategoriesToMovie(movie, categoryIds);
        
        // Refresh movie to get updated category list
        movie = movieRepository.findById(tmdbId)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + tmdbId));
        
        log.info("Admin updated categories for movie: {}", tmdbId);
        return toAdminMovieDto(movie);
    }
}
