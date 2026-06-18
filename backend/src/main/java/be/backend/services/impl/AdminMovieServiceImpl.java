package be.backend.services.impl;

import be.backend.entity.Category;
import be.backend.entity.Genre;
import be.backend.entity.Movie;
import be.backend.entity.MovieCategory;
import be.backend.entity.MovieGenre;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.CategoryDto;
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
        
        List<Integer> movieIds = moviePage.getContent().stream().map(Movie::getId).toList();
        java.util.Map<Integer, Object[]> statsMap = new java.util.HashMap<>();
        if (!movieIds.isEmpty()) {
            List<Object[]> batchStats = movieRepository.findMovieStatsBatch(movieIds);
            for (Object[] row : batchStats) {
                statsMap.put((Integer) row[0], row);
            }
        }
        
        Page<AdminMovieDto> dtoPage = moviePage.map(movie -> toAdminMovieDto(movie, statsMap.get(movie.getId())));
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMovieDto getMovieDetail(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(tmdbId));
        return toAdminMovieDto(movie, stats.isEmpty() ? null : stats.get(0));
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
        
        // Add genres before saving
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            addGenresToMovie(movie, request.getGenreIds());
        }
        
        // Add categories before saving
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            addCategoriesToMovie(movie, request.getCategoryIds());
        }
        
        Movie savedMovie = movieRepository.save(movie);
        
        log.info("Admin created movie: {} ({})", savedMovie.getTitle(), savedMovie.getId());
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(savedMovie.getId()));
        return toAdminMovieDto(savedMovie, stats.isEmpty() ? null : stats.get(0));
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
        
        // Update genres if provided
        if (request.getGenreIds() != null) {
            movie.getMovieGenres().clear();
            // Flush the DELETE to DB before inserting new records to avoid Duplicate entry
            movieRepository.saveAndFlush(movie);
            addGenresToMovie(movie, request.getGenreIds());
        }
        
        // Update categories if provided
        if (request.getCategoryIds() != null) {
            movie.getMovieCategories().clear();
            // Flush the DELETE to DB before inserting new records to avoid Duplicate entry
            movieRepository.saveAndFlush(movie);
            addCategoriesToMovie(movie, request.getCategoryIds());
        }
        
        Movie updatedMovie = movieRepository.saveAndFlush(movie);
        
        log.info("Admin updated movie: {} ({})", updatedMovie.getTitle(), updatedMovie.getId());
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(updatedMovie.getId()));
        return toAdminMovieDto(updatedMovie, stats.isEmpty() ? null : stats.get(0));
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
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(restored.getId()));
        return toAdminMovieDto(restored, stats.isEmpty() ? null : stats.get(0));
    }

    /**
     * Convert Movie entity to AdminMovieDto
     */
    private AdminMovieDto toAdminMovieDto(Movie movie, Object[] stats) {
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
        List<CategoryDto> categories = movie.getMovieCategories().stream()
            .map(mc -> new CategoryDto(mc.getCategory().getCategoryId(), mc.getCategory().getName()))
            .collect(Collectors.toList());
        dto.setCategories(categories);
        
        // Statistics
        if (stats != null) {
            dto.setTotalViews(((Number) stats[1]).longValue());
            dto.setTotalReviews(((Number) stats[2]).longValue());
            dto.setTotalWatchlist(((Number) stats[3]).longValue());
            
            if (stats[4] != null) {
                double avgRating = ((Number) stats[4]).doubleValue();
                dto.setAverageRating(Math.round(avgRating * 10.0) / 10.0);
            } else {
                dto.setAverageRating(0.0);
            }
        } else {
            dto.setTotalViews(0L);
            dto.setTotalReviews(0L);
            dto.setTotalWatchlist(0L);
            dto.setAverageRating(0.0);
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
            movie.getMovieGenres().add(movieGenre);
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
            movie.getMovieCategories().add(movieCategory);
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
        
        movie.getMovieGenres().clear();
        movieRepository.saveAndFlush(movie);
        addGenresToMovie(movie, genreIds);
        
        Movie updated = movieRepository.saveAndFlush(movie);
        log.info("Admin updated genres for movie: {}", tmdbId);
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(updated.getId()));
        return toAdminMovieDto(updated, stats.isEmpty() ? null : stats.get(0));
    }

    @Override
    public AdminMovieDto updateMovieCategories(Integer tmdbId, List<String> categoryIds) {
        Movie movie = findMovieById(tmdbId);
        
        movie.getMovieCategories().clear();
        movieRepository.saveAndFlush(movie);
        addCategoriesToMovie(movie, categoryIds);
        
        Movie updated = movieRepository.saveAndFlush(movie);
        log.info("Admin updated categories for movie: {}", tmdbId);
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(updated.getId()));
        return toAdminMovieDto(updated, stats.isEmpty() ? null : stats.get(0));
    }
}
