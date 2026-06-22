package be.backend.services.impl;

import be.backend.entity.Category;
import be.backend.entity.Genre;
import be.backend.entity.Movie;
import be.backend.entity.MovieCategory;
import be.backend.entity.MovieGenre;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.MovieMapper;
import be.backend.model.dto.AdminMovieDto;
import be.backend.model.dto.CategoryDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.dto.MovieDetailDto;
import be.backend.model.dto.MovieDto;
import be.backend.model.dto.TrendingMovieDto;
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
import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;
    private final MovieMapper movieMapper;
    private final ViewLogRepository viewLogRepository;
    private final GenreRepository genreRepository;
    private final CategoryRepository categoryRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieCategoryRepository movieCategoryRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieDto> getMovies(int page, int size, String search, Integer genreId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("addedAt").descending());

        Page<Movie> result;
        if (genreId != null) {
            result = movieRepository.findActiveByGenre(genreId, pageable);
        } else if (search != null && !search.isBlank()) {
            result = movieRepository.searchByKeyword(search.trim(), pageable);
        } else {
            result = movieRepository.findByIsActiveTrue(pageable);
        }

        return PageResponse.from(result.map(movieMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public MovieDetailDto getMovieDetail(Integer id) {
        Movie movie = movieRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id=" + id));
        MovieDetailDto dto = movieMapper.toDetailDto(movie);

        boolean isUpcoming = movie.getMovieCategories().stream()
                .anyMatch(mc -> "upcoming".equals(mc.getCategory().getCategoryId()));

        boolean locked = isUpcoming && movie.getReleaseDate() != null && movie.getReleaseDate().isAfter(LocalDateTime.now());
        dto.setIsLocked(locked);

        if (locked) {
            dto.setTrailerUrl(null);
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TrendingMovieDto> getTrendingMovies(
            int page,
            int size) {

        Pageable pageable =
                PageRequest.of(page, size);

        Instant fromDate =
                Instant.now().minus(7, ChronoUnit.DAYS);

        Page<Integer> movieIds =
                viewLogRepository.findTrendingMovieIds(
                        fromDate,
                        pageable
                );

        List<TrendingMovieDto> content =
                movieIds.getContent()
                        .stream()
                        .map(movieRepository::findById)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .map(this::toTrendingDto)
                        .toList();

        return PageResponse.from(
                new PageImpl<>(
                        content,
                        pageable,
                        movieIds.getTotalElements()
                )
        );
    }

    private TrendingMovieDto toTrendingDto(Movie movie) {

        TrendingMovieDto dto = new TrendingMovieDto();

        dto.setMovieId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setPosterPath(movie.getPosterPath());
        dto.setVoteAverage(movie.getVoteAverage());
        dto.setReleaseDate(movie.getReleaseDate());

        return dto;
    }

    // --- Admin Methods ---

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminMovieDto> getAllMoviesAdmin(int page, int size, String search, Boolean isActive) {
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
    public AdminMovieDto getMovieDetailAdmin(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(tmdbId));
        return toAdminMovieDto(movie, stats.isEmpty() ? null : stats.get(0));
    }

    @Override
    @Transactional
    public AdminMovieDto createMovie(AdminCreateMovieRequest request) {
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
        
        User currentAdmin = getCurrentAdmin();
        movie.setAddedBy(currentAdmin);
        
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            addGenresToMovie(movie, request.getGenreIds());
        }
        
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            addCategoriesToMovie(movie, request.getCategoryIds());
        }
        
        Movie savedMovie = movieRepository.save(movie);
        
        log.info("Admin created movie: {} ({})", savedMovie.getTitle(), savedMovie.getId());
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(savedMovie.getId()));
        return toAdminMovieDto(savedMovie, stats.isEmpty() ? null : stats.get(0));
    }

    @Override
    @Transactional
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
        
        if (request.getGenreIds() != null) {
            movie.getMovieGenres().clear();
            movieRepository.saveAndFlush(movie);
            addGenresToMovie(movie, request.getGenreIds());
        }
        
        if (request.getCategoryIds() != null) {
            movie.getMovieCategories().clear();
            movieRepository.saveAndFlush(movie);
            addCategoriesToMovie(movie, request.getCategoryIds());
        }
        
        Movie updatedMovie = movieRepository.saveAndFlush(movie);
        
        log.info("Admin updated movie: {} ({})", updatedMovie.getTitle(), updatedMovie.getId());
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(updatedMovie.getId()));
        return toAdminMovieDto(updatedMovie, stats.isEmpty() ? null : stats.get(0));
    }

    @Override
    @Transactional
    public void deleteMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(false);
        movieRepository.save(movie);
        log.info("Admin deactivated movie: {} ({})", movie.getTitle(), movie.getId());
    }

    @Override
    @Transactional
    public AdminMovieDto restoreMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(true);
        Movie restored = movieRepository.save(movie);
        
        log.info("Admin restored movie: {} ({})", movie.getTitle(), movie.getId());
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(restored.getId()));
        return toAdminMovieDto(restored, stats.isEmpty() ? null : stats.get(0));
    }

    @Override
    @Transactional
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
    @Transactional
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
        
        List<GenreDto> genres = movie.getMovieGenres().stream()
            .map(mg -> new GenreDto(mg.getGenre().getId(), mg.getGenre().getName()))
            .collect(Collectors.toList());
        dto.setGenres(genres);
        
        List<CategoryDto> categories = movie.getMovieCategories().stream()
            .map(mc -> new CategoryDto(mc.getCategory().getCategoryId(), mc.getCategory().getName()))
            .collect(Collectors.toList());
        dto.setCategories(categories);
        
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

    private Movie findMovieById(Integer tmdbId) {
        return movieRepository.findById(tmdbId)
            .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + tmdbId));
    }

    private User getCurrentAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("Admin user not found"));
        }
        throw new IllegalStateException("No authenticated admin");
    }
}