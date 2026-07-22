package be.backend.services.impl;

import be.backend.entity.*;
import be.backend.enums.RecommendationSource;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.RecommendationCandidate;
import be.backend.model.dto.RecommendationContext;
import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.*;
import be.backend.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private static final int MAX_RESULT = 30;

    private final MovieRepository movieRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MoviePersonRepository moviePersonRepository;
    private final ReviewRepository reviewRepository;
    private final ViewLogRepository viewLogRepository;
    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;

    // ================================
    // MAIN API
    // ================================
    @Override
    public PageResponse<RecommendationDto> getRecommendations(
            int page,
            int size) {

        User user = getCurrentUser();

        RecommendationContext context =
                buildContext(user);

        Map<Integer, RecommendationCandidate> recommendationMap =
                new HashMap<>();

        generateContentBased(
                user,
                context,
                recommendationMap);

        generateViewHistory(
                user,
                context,
                recommendationMap);

        generateWatchlist(
                user,
                context,
                recommendationMap);

        generateHighRating(
                user,
                context,
                recommendationMap);

        generateActorDirector(
                user,
                context,
                recommendationMap);

        generateAssociation(
                user,
                context,
                recommendationMap);

        if (recommendationMap.isEmpty()) {

            generateTrendingFallback(
                    context,
                    recommendationMap);
        }

        List<RecommendationDto> recommendations =
                recommendationMap.values()
                        .stream()
                        .sorted(
                                Comparator.comparingDouble(
                                                RecommendationCandidate::getScore)
                                        .reversed())
                        .limit(MAX_RESULT)
                        .map(this::toDto)
                        .toList();

        int start =
                Math.min(
                        page * size,
                        recommendations.size());

        int end =
                Math.min(
                        start + size,
                        recommendations.size());

        return PageResponse.from(
                new PageImpl<>(
                        recommendations.subList(start, end),
                        PageRequest.of(page, size),
                        recommendations.size()));
    }

    // ================================
    // ALGORITHMS
    // ================================

    // ================================
// CONTENT BASED
// ================================

    private void generateContentBased(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        ViewLog latestView =
                viewLogRepository
                        .findTopByUser_IdOrderByWatchedAtDesc(user.getId())
                        .orElse(null);

        if (latestView == null) {
            return;
        }

        List<MovieGenre> genres =
                movieGenreRepository.findByTmdb_Id(
                        latestView.getTmdb().getId());

        for (MovieGenre genre : genres) {

            List<MovieGenre> relatedMovies =
                    movieGenreRepository.findByGenre_Id(
                            genre.getGenre().getId());

            for (MovieGenre candidate : relatedMovies) {

                Movie movie = candidate.getTmdb();

                if (!isValidRecommendation(
                        movie,
                        latestView.getTmdb().getId(),
                        context)) {
                    continue;
                }

                addScore(
                        recommendationMap,
                        movie,
                        RecommendationSource.CONTENT_BASED,
                        "Movies similar to \"" +
                                latestView.getTmdb().getTitle() + "\"",
                        3.5
                );
            }
        }
    }

// ================================
// VIEW HISTORY
// ================================

    private void generateViewHistory(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        List<ViewLog> histories =
                viewLogRepository
                        .findTop20ByUser_IdOrderByWatchedAtDesc(
                                user.getId());

        if (histories.isEmpty()) {
            return;
        }

        Map<Integer, Long> genreFrequency =
                new HashMap<>();

        for (ViewLog history : histories) {

            List<MovieGenre> genres =
                    movieGenreRepository.findByTmdb_Id(
                            history.getTmdb().getId());

            for (MovieGenre genre : genres) {

                genreFrequency.merge(
                        genre.getGenre().getId(),
                        1L,
                        Long::sum
                );
            }
        }

        Integer favoriteGenre =
                findFavoriteGenreId(
                        genreFrequency);

        if (favoriteGenre == null) {
            return;
        }

        List<MovieGenre> candidates =
                movieGenreRepository.findByGenre_Id(
                        favoriteGenre);

        for (MovieGenre candidate : candidates) {

            Movie movie =
                    candidate.getTmdb();

            if (!isValidRecommendation(
                    movie,
                    null,
                    context)) {
                continue;
            }

            addScore(
                    recommendationMap,
                    movie,
                    RecommendationSource.VIEW_HISTORY,
                    "Based on your viewing history",
                    2.5
            );
        }
    }

    // ================================
// WATCHLIST
// ================================

    private void generateWatchlist(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        Watchlist latest =
                watchlistRepository
                        .findTopByUser_IdOrderByAddedAtDesc(
                                user.getId())
                        .orElse(null);

        if (latest == null) {
            return;
        }

        List<MovieGenre> genres =
                movieGenreRepository.findByTmdb_Id(
                        latest.getTmdb().getId());

        for (MovieGenre genre : genres) {

            List<MovieGenre> candidates =
                    movieGenreRepository.findByGenre_Id(
                            genre.getGenre().getId());

            for (MovieGenre candidate : candidates) {

                Movie movie = candidate.getTmdb();

                if (!isValidRecommendation(
                        movie,
                        latest.getTmdb().getId(),
                        context)) {
                    continue;
                }

                addScore(
                        recommendationMap,
                        movie,
                        RecommendationSource.WATCHLIST,
                        "Based on your watchlist",
                        2.8
                );
            }
        }
    }

// ================================
// HIGH RATING
// ================================

    private void generateHighRating(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        List<Review> reviews =
                reviewRepository
                        .findByUser_IdAndRatingGreaterThanEqual(
                                user.getId(),
                                BigDecimal.valueOf(4));

        if (reviews.isEmpty()) {
            return;
        }

        Map<Integer, Long> genreFrequency =
                new HashMap<>();

        for (Review review : reviews) {

            List<MovieGenre> genres =
                    movieGenreRepository.findByTmdb_Id(
                            review.getTmdb().getId());

            for (MovieGenre genre : genres) {

                genreFrequency.merge(
                        genre.getGenre().getId(),
                        1L,
                        Long::sum);
            }
        }

        Integer favoriteGenre =
                findFavoriteGenreId(
                        genreFrequency);

        if (favoriteGenre == null) {
            return;
        }

        List<MovieGenre> candidates =
                movieGenreRepository.findByGenre_Id(
                        favoriteGenre);

        for (MovieGenre candidate : candidates) {

            Movie movie =
                    candidate.getTmdb();

            if (!isValidRecommendation(
                    movie,
                    null,
                    context)) {
                continue;
            }

            addScore(
                    recommendationMap,
                    movie,
                    RecommendationSource.HIGH_RATING,
                    "Because you highly rated similar movies",
                    3.2
            );
        }
    }

    // ================================
// ACTOR / DIRECTOR
// ================================

    private void generateActorDirector(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        ViewLog latest =
                viewLogRepository
                        .findTopByUser_IdOrderByWatchedAtDesc(
                                user.getId())
                        .orElse(null);

        if (latest == null) {
            return;
        }

        List<MoviePerson> moviePeople =
                moviePersonRepository.findByTmdb_Id(
                        latest.getTmdb().getId());

        List<Integer> personIds =
                moviePeople.stream()
                        .map(mp -> mp.getPerson().getId())
                        .distinct()
                        .toList();

        if (personIds.isEmpty()) {
            return;
        }

        List<MoviePerson> relatedMovies =
                moviePersonRepository.findByPersonIds(
                        personIds);

        for (MoviePerson related : relatedMovies) {

            Movie movie =
                    related.getTmdb();

            if (!isValidRecommendation(
                    movie,
                    latest.getTmdb().getId(),
                    context)) {
                continue;
            }

            addScore(
                    recommendationMap,
                    movie,
                    RecommendationSource.ACTOR_DIRECTOR,
                    "Same actor or director",
                    2.7
            );
        }
    }

//
// ================================
// ASSOCIATION RULE
// ================================

    private void generateAssociation(
            User user,
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        ViewLog latest =
                viewLogRepository
                        .findTopByUser_IdOrderByWatchedAtDesc(
                                user.getId())
                        .orElse(null);

        if (latest == null) {
            return;
        }

        Integer movieId =
                latest.getTmdb().getId();

        List<Integer> userIds =
                viewLogRepository.findUserIdsByMovieId(movieId);

        if (userIds.isEmpty()) {
            return;
        }

        List<Integer> movieIds =
                viewLogRepository.findPopularMoviesByUsers(
                        userIds,
                        PageRequest.of(0, 50));

        for (Integer candidateMovieId : movieIds) {

            movieRepository.findById(candidateMovieId)
                    .ifPresent(movie -> {

                        if (!isValidRecommendation(
                                movie,
                                movieId,
                                context)) {
                            return;
                        }

                        addScore(
                                recommendationMap,
                                movie,
                                RecommendationSource.ASSOCIATION_RULE,
                                "People who watched this also watched",
                                2.9
                        );
                    });
        }
    }

//
// ================================
// TRENDING FALLBACK
// ================================

    private void generateTrendingFallback(
            RecommendationContext context,
            Map<Integer, RecommendationCandidate> recommendationMap) {

        Instant from =
                Instant.now()
                        .minus(30, ChronoUnit.DAYS);

        List<Integer> trendingMovieIds =
                viewLogRepository
                        .findTrendingMovieIds(
                                from,
                                PageRequest.of(0, 20))
                        .getContent();

        for (Integer movieId : trendingMovieIds) {

            movieRepository.findById(movieId)
                    .ifPresent(movie -> {

                        if (!isValidRecommendation(
                                movie,
                                null,
                                context)) {
                            return;
                        }

                        addScore(
                                recommendationMap,
                                movie,
                                RecommendationSource.TRENDING,
                                "Trending now",
                                1.5
                        );
                    });
        }
    }

    // ================================
// SCORE
// ================================

    private void addScore(
            Map<Integer, RecommendationCandidate> recommendationMap,
            Movie movie,
            RecommendationSource source,
            String reason,
            double score) {

        RecommendationCandidate candidate =
                recommendationMap.computeIfAbsent(
                        movie.getId(),
                        id -> {

                            RecommendationCandidate c =
                                    new RecommendationCandidate();

                            c.setMovie(movie);
                            c.setScore(0);

                            return c;
                        });

        candidate.setScore(candidate.getScore() + score);

        candidate.getReasons().add(reason);

        candidate.getSources().add(source);
    }

//
// ================================
// VALIDATION
// ================================

    private boolean isValidRecommendation(
            Movie movie,
            Integer currentMovieId,
            RecommendationContext context) {

        if (movie == null) {
            return false;
        }

        if (Objects.equals(
                movie.getId(),
                currentMovieId)) {
            return false;
        }

        if (context.getViewedMovieIds()
                .contains(movie.getId())) {
            return false;
        }

        if (context.getWatchlistMovieIds()
                .contains(movie.getId())) {
            return false;
        }

        return Boolean.TRUE.equals(
                movie.getIsActive());
    }

//
// ================================
// BUILD CONTEXT
// ================================

    private RecommendationContext buildContext(
            User user) {

        RecommendationContext context =
                new RecommendationContext();

        context.setViewedMovieIds(

                viewLogRepository
                        .findByUser_Id(user.getId())
                        .stream()
                        .map(v -> v.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        context.setWatchlistMovieIds(

                watchlistRepository
                        .findByUser_Id(user.getId())
                        .stream()
                        .map(w -> w.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        return context;
    }

    // ================================
// DTO
// ================================

    private RecommendationDto toDto(
            RecommendationCandidate candidate) {

        RecommendationDto dto =
                new RecommendationDto();

        dto.setMovieId(
                candidate.getMovie().getId());

        dto.setTitle(
                candidate.getMovie().getTitle());

        dto.setPosterPath(
                candidate.getMovie().getPosterPath());
                
        dto.setVoteAverage(
                candidate.getMovie().getVoteAverage());
                
        dto.setReleaseDate(
                candidate.getMovie().getReleaseDate());

        dto.setScore(
                candidate.getScore());

        dto.setReasons(
                new ArrayList<>(candidate.getReasons()));

        dto.setSources(
                candidate.getSources()
                        .stream()
                        .map(Enum::name)
                        .toList());

        return dto;
    }

//
// ================================
// FAVORITE GENRE
// ================================

    private Integer findFavoriteGenreId(
            Map<Integer, Long> genreFrequency) {

        return genreFrequency.entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

//
// ================================
// CURRENT USER
// ================================

    private User getCurrentUser() {

        var authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResourceNotFoundException(
                    "User not logged in");
        }

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: " + email));
    }
}