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
import be.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MovieServiceImpl implements MovieService {

    private static final int MAX_PREMIUM_MOVIES = 10;

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
    private final NotificationService notificationService;


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

        // Lock upcoming — releaseDate là LocalDate
        boolean isUpcoming = movie.getMovieCategories().stream()
                .anyMatch(mc -> "upcoming".equals(mc.getCategory().getCategoryId()));
        boolean upcomingLocked = isUpcoming
                && movie.getReleaseDate() != null
                && movie.getReleaseDate().isAfter(Instant.now());

        dto.setIsLocked(upcomingLocked);
        if (upcomingLocked) dto.setTrailerUrl(null);

        // Lock premium
        boolean requiresPremium = Boolean.TRUE.equals(movie.getIsPremium());
        dto.setRequiresPremium(requiresPremium);

        if (requiresPremium && !currentUserHasActivePremium()) {
            dto.setTrailerUrl(null);
            dto.setIsLocked(true);
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TrendingMovieDto> getTrendingMovies(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Instant fromDate = Instant.now().minus(7, ChronoUnit.DAYS);

        Page<Integer> movieIds = viewLogRepository.findTrendingMovieIds(fromDate, pageable);

        List<TrendingMovieDto> content = movieIds.getContent().stream()
                .map(movieRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(this::toTrendingDto)
                .toList();

        return PageResponse.from(new PageImpl<>(content, pageable, movieIds.getTotalElements()));
    }

    // ---------------------------------------------------------------- Admin

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminMovieDto> getAllMoviesAdmin(int page, int size, String search, Boolean isActive) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "addedAt"));

        Page<Movie> moviePage;
        if (search != null && !search.isBlank()) {
            moviePage = movieRepository.searchByKeyword(search.trim(), pageable);
        } else if (isActive != null) {
            moviePage = isActive
                    ? movieRepository.findByIsActiveTrue(pageable)
                    : movieRepository.findAll(pageable);
        } else {
            moviePage = movieRepository.findAll(pageable);
        }

        Map<Integer, Object[]> statsMap = fetchStatsMap(moviePage);
        return PageResponse.from(moviePage.map(m -> toAdminMovieDto(m, statsMap.get(m.getId()))));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMovieDto getMovieDetailAdmin(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        return toAdminMovieDto(movie, fetchSingleStats(tmdbId));
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
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setIsActive(true);
        movie.setIsPremium(false);
        movie.setAddedAt(Instant.now());
        movie.setAddedBy(getCurrentAdmin());

        Movie saved = movieRepository.save(movie);

        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            addGenresToMovie(saved, request.getGenreIds());
        }

        refreshMovieCategories(saved, false); // Not trending initially unless forced
        // gửi notification cho tất cả user
        List<User> users = userRepository.findAll();

        for (User user : users) {
            notificationService.createNewMovieNotification(
                    user,
                    saved.getTitle()
            );
        }

        log.info("Admin created movie: {} (id={})", saved.getTitle(), saved.getId());
        return toAdminMovieDto(saved, fetchSingleStats(saved.getId()));
    }

    @Override
    @Transactional
    public AdminMovieDto updateMovie(Integer tmdbId, AdminUpdateMovieRequest request) {
        Movie movie = findMovieById(tmdbId);

        if (request.getTitle() != null)        movie.setTitle(request.getTitle());
        if (request.getOverview() != null)     movie.setOverview(request.getOverview());
        if (request.getPosterPath() != null)   movie.setPosterPath(request.getPosterPath());
        if (request.getBackdropPath() != null) movie.setBackdropPath(request.getBackdropPath());
        if (request.getReleaseDate() != null)  movie.setReleaseDate(request.getReleaseDate());
        if (request.getTrailerUrl() != null)   movie.setTrailerUrl(request.getTrailerUrl());
        if (request.getIsActive() != null)     movie.setIsActive(request.getIsActive());

        if (request.getGenreIds() != null) {
            movieGenreRepository.deleteByMovieId(tmdbId);
            movieGenreRepository.flush();
            movie.getMovieGenres().clear();
            addGenresToMovie(movie, request.getGenreIds());
        }

        refreshMovieCategories(movie, false);

        Movie updated = movieRepository.saveAndFlush(movie);
        log.info("Admin updated movie: {} (id={})", updated.getTitle(), updated.getId());
        return toAdminMovieDto(updated, fetchSingleStats(updated.getId()));
    }

    @Override
    @Transactional
    public void deleteMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(false);
        movieRepository.save(movie);
        log.info("Admin deactivated movie: {} (id={})", movie.getTitle(), movie.getId());
    }

    @Override
    @Transactional
    public AdminMovieDto restoreMovie(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        movie.setIsActive(true);
        Movie restored = movieRepository.save(movie);
        log.info("Admin restored movie: {} (id={})", restored.getTitle(), restored.getId());
        return toAdminMovieDto(restored, fetchSingleStats(restored.getId()));
    }

    @Override
    @Transactional
    public AdminMovieDto updateMovieGenres(Integer tmdbId, List<Integer> genreIds) {
        Movie movie = findMovieById(tmdbId);
        if (!movie.getMovieGenres().isEmpty()) {
            movieGenreRepository.deleteByMovieId(tmdbId);
            movieGenreRepository.flush();
            movie.getMovieGenres().clear();
        }
        addGenresToMovie(movie, genreIds);

        Movie updated = movieRepository.save(movie);
        log.info("Admin updated genres for movie id={}", tmdbId);
        return toAdminMovieDto(updated, fetchSingleStats(updated.getId()));
    }

    @Override
    @Transactional
    public void refreshAllMovieCategories() {
        Pageable pageable = PageRequest.of(0, 50);
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Integer> trendingIds = viewLogRepository.findTrendingMovieIds(sevenDaysAgo, pageable).getContent();

        List<Movie> activeMovies = movieRepository.findByIsActiveTrue(Pageable.unpaged()).getContent();
        for (Movie movie : activeMovies) {
            boolean isTrending = trendingIds.contains(movie.getId());
            refreshMovieCategories(movie, isTrending);
        }
        movieRepository.saveAll(activeMovies);
        log.info("Admin manually or cron refreshed all movie categories");
    }

    @Override
    @Transactional
    public void refreshMovieCategories(Integer tmdbId) {
        Movie movie = findMovieById(tmdbId);
        
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Integer> trendingIds = viewLogRepository.findTrendingMovieIds(sevenDaysAgo, PageRequest.of(0, 50)).getContent();
        boolean isTrending = trendingIds.contains(movie.getId());
        
        refreshMovieCategories(movie, isTrending);
        movieRepository.save(movie);
    }
    
    private void refreshMovieCategories(Movie movie, boolean isTrending) {
        if (!movie.getMovieCategories().isEmpty()) {
            movieCategoryRepository.deleteByMovieId(movie.getId());
            movieCategoryRepository.flush();
            movie.getMovieCategories().clear();
        }

        Instant now = Instant.now();
        Instant sixtyDaysAgo = now.minus(60, ChronoUnit.DAYS);

        // 1. upcoming: releaseDate > now
        if (movie.getReleaseDate() != null && movie.getReleaseDate().isAfter(now)) {
            addCategoryToMovie(movie, "upcoming");
        }

        // 2. now_playing: releaseDate <= now AND releaseDate >= 60 days ago
        if (movie.getReleaseDate() != null && !movie.getReleaseDate().isAfter(now) && movie.getReleaseDate().isAfter(sixtyDaysAgo)) {
            addCategoryToMovie(movie, "now_playing");
        }

        // 3. top_rated: TMDB rating >= 8.0 or internal rating >= 8.0
        double rating = 0.0;
        int count = 0;
        if (movie.getVoteAverage() != null && movie.getVoteAverage() > 0) {
            rating = movie.getVoteAverage();
            count = movie.getVoteCount() != null ? movie.getVoteCount() : 0;
        } else {
            Object[] stats = fetchSingleStats(movie.getId());
            if (stats != null) {
                count = stats[2] != null ? ((Number) stats[2]).intValue() : 0;
                rating = stats[4] != null ? ((Number) stats[4]).doubleValue() : 0.0;
            }
        }

        if (rating >= 8.0 && count >= 5) {
            addCategoryToMovie(movie, "top_rated");
        }

        // 4. trending
        if (isTrending) {
            addCategoryToMovie(movie, "trending");
        }
    }

    private void addCategoryToMovie(Movie movie, String categoryId) {
        categoryRepository.findById(categoryId).ifPresent(category -> {
            MovieCategory mc = new MovieCategory();
            mc.setTmdb(movie);
            mc.setCategory(category);
            mc = movieCategoryRepository.save(mc);
            movie.getMovieCategories().add(mc);
        });
    }

    @Override
    @Transactional
    public AdminMovieDto setMoviePremium(Integer tmdbId, boolean isPremium) {
        if (isPremium && movieRepository.countByIsPremiumTrue() >= MAX_PREMIUM_MOVIES) {
            throw new IllegalStateException("Maximum " + MAX_PREMIUM_MOVIES + " premium movies allowed");
        }
        Movie movie = findMovieById(tmdbId);
        movie.setIsPremium(isPremium);
        Movie saved = movieRepository.save(movie);
        log.info("Admin {} movie id={} as premium", isPremium ? "marked" : "unmarked", tmdbId);
        return toAdminMovieDto(saved, fetchSingleStats(saved.getId()));
    }

    // ---------------------------------------------------------------- Helpers

    private boolean currentUserHasActivePremium() {
        User user = getCurrentUserOrNull();
        return user != null
                && Boolean.TRUE.equals(user.getIsPremium())
                && user.getPremiumExpiresAt() != null
                && user.getPremiumExpiresAt().isAfter(Instant.now());
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
        dto.setIsPremium(movie.getIsPremium());

        if (movie.getAddedBy() != null) {
            dto.setAddedBy(movie.getAddedBy().getId());
            dto.setAddedByName(movie.getAddedBy().getFullName());
        }

        dto.setGenres(movie.getMovieGenres().stream()
                .map(mg -> new GenreDto(mg.getGenre().getId(), mg.getGenre().getName()))
                .collect(Collectors.toList()));

        dto.setCategories(movie.getMovieCategories().stream()
                .map(mc -> new CategoryDto(mc.getCategory().getCategoryId(), mc.getCategory().getName()))
                .collect(Collectors.toList()));

        if (stats != null) {
            dto.setTotalViews(((Number) stats[1]).longValue());
            dto.setTotalReviews(((Number) stats[2]).longValue());
            dto.setTotalWatchlist(((Number) stats[3]).longValue());
            dto.setAverageRating(stats[4] != null
                    ? Math.round(((Number) stats[4]).doubleValue() * 10.0) / 10.0
                    : 0.0);
        } else {
            dto.setTotalViews(0L);
            dto.setTotalReviews(0L);
            dto.setTotalWatchlist(0L);
            dto.setAverageRating(0.0);
        }

        return dto;
    }

    private Map<Integer, Object[]> fetchStatsMap(Page<Movie> moviePage) {
        List<Integer> ids = moviePage.getContent().stream().map(Movie::getId).toList();
        if (ids.isEmpty()) return Map.of();

        Map<Integer, Object[]> statsMap = new HashMap<>();
        movieRepository.findMovieStatsBatch(ids).forEach(row -> statsMap.put((Integer) row[0], row));
        return statsMap;
    }

    private Object[] fetchSingleStats(Integer tmdbId) {
        List<Object[]> stats = movieRepository.findMovieStatsBatch(List.of(tmdbId));
        return stats.isEmpty() ? null : stats.get(0);
    }

    private void addGenresToMovie(Movie movie, List<Integer> genreIds) {
        for (Integer genreId : genreIds) {
            Genre genre = genreRepository.findById(genreId)
                    .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
            MovieGenre mg = new MovieGenre();
            mg.setTmdb(movie);
            mg.setGenre(genre);
            mg = movieGenreRepository.save(mg);
            movie.getMovieGenres().add(mg);
        }
    }



    private Movie findMovieById(Integer tmdbId) {
        return movieRepository.findById(tmdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found: " + tmdbId));
    }

    private User getCurrentAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails ud) {
            return userRepository.findByEmail(ud.getUsername())
                    .orElseThrow(() -> new IllegalStateException("Admin user not found"));
        }
        throw new IllegalStateException("No authenticated admin");
    }

    private User getCurrentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) return null;
        if (auth.getPrincipal() instanceof UserDetails ud) {
            return userRepository.findByEmail(ud.getUsername()).orElse(null);
        }
        return null;
    }
}