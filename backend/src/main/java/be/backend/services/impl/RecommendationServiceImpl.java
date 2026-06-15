package be.backend.services.impl;

import be.backend.entity.*;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.RecommendationContext;
import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.*;
import be.backend.services.NotificationService;
import be.backend.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {


    private final NotificationService notificationService;
    private final MovieGenreRepository movieGenreRepository;
    private final ViewLogRepository viewLogRepository;
    private final WatchlistRepository watchlistRepository;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;


    @Override
    @Transactional(readOnly = true)

    public PageResponse<RecommendationDto> getRecommendations(
            int page,
            int size) {

        User user = getCurrentUser();

        Pageable pageable =
                PageRequest.of(page, size);

        Page<Recommendation> recommendationPage =
                recommendationRepository
                        .findByUser_IdOrderByCreatedAtDesc(
                                user.getId(),
                                pageable
                        );

        List<RecommendationDto> content =
                recommendationPage.getContent()
                        .stream()
                        .map(this::toDto)
                        .toList();

        return PageResponse.from(
                new PageImpl<>(
                        content,
                        pageable,
                        recommendationPage.getTotalElements()
                )
        );
    }

    @Override
    @Transactional
    public void generateRecommendations() {
        generateAllRecommendations(getCurrentUser());
    }

    private void generateAllRecommendations(User user) {

        RecommendationContext context = buildContext(user);

        recommendationRepository.deleteByUser_Id(user.getId());

        context.getRecommendedMovieIds().clear();

        generateContentBasedRecommendations(user, context);
        generateViewHistoryRecommendations(user, context);
        generateWatchlistRecommendations(user, context);
        generateHighRatingRecommendations(user, context);
        generateTrendingRecommendations(user, context);
    }


    @Override
    @Transactional
    public void generateRecommendations(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        recommendationRepository.deleteByUser_Id(userId);
        generateAllRecommendations(user);
    }


    private void generateContentBasedRecommendations(
            User user,
            RecommendationContext context) {
        ViewLog latestView = viewLogRepository.findTopByUser_IdOrderByWatchedAtDesc(user.getId())
                .orElse(null);

        if (latestView == null) {
            return;
        }

        List<MovieGenre> genres =
                movieGenreRepository.findByTmdb_Id(latestView.getTmdb().getId());

        List<MovieGenre> allCandidates = new ArrayList<>();

        for (MovieGenre genre : genres) {
            allCandidates.addAll(
                    movieGenreRepository.findByGenre_Id(
                            genre.getGenre().getId()
                    )
            );
        }

        generateRecommendationsFromCandidates(
                user,
                allCandidates,
                latestView.getTmdb().getId(),
                RecommendationSource.CONTENT_BASED,
                "Phim cùng thể loại với "
                        + latestView.getTmdb().getTitle(),
                context
        );
    }

    @Override
    @Transactional
    public void deleteRecommendation(Integer recommendationId) {

        User user = getCurrentUser();

        Recommendation recommendation =
                recommendationRepository.findById(recommendationId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Không tìm thấy recommendation: "
                                                + recommendationId
                                ));

        if (!recommendation.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Bạn không có quyền xóa recommendation này"
            );
        }

        recommendationRepository.delete(recommendation);
    }


    private void generateViewHistoryRecommendations(User user,
                                                    RecommendationContext context) {
        List<ViewLog> histories =
                viewLogRepository
                        .findTop20ByUser_IdOrderByWatchedAtDesc(
                                user.getId()
                        );

        if (histories.isEmpty()) {
            return;
        }

        Map<Integer, Long> genreFrequency = new HashMap<>();

        for (ViewLog viewLog : histories) {

            List<MovieGenre> genres =
                    movieGenreRepository.findByTmdb_Id(
                            viewLog.getTmdb().getId()
                    );

            for (MovieGenre genre : genres) {

                Integer genreId =
                        genre.getGenre().getId();

                genreFrequency.put(genreId, genreFrequency.getOrDefault(genreId, 0L) + 1);
            }
        }

        Integer favoriteGenreId = findFavoriteGenreId(genreFrequency);

        if (favoriteGenreId == null) {
            return;
        }

        List<MovieGenre> candidates =
                movieGenreRepository.findByGenre_Id(
                        favoriteGenreId
                );

        generateRecommendationsFromCandidates(
                user,
                candidates,
                null,
                RecommendationSource.VIEW_HISTORY,
                "Dựa trên lịch sử xem của bạn",
                context
        );
    }


    private void generateWatchlistRecommendations(User user,
                                                  RecommendationContext context) {

        Watchlist latestWatchlist = watchlistRepository.findTopByUser_IdOrderByAddedAtDesc(user.getId())
                .orElse(null);

        if (latestWatchlist == null) {
            return;
        }

        List<MovieGenre> genres =
                movieGenreRepository.findByTmdb_Id(
                        latestWatchlist.getTmdb().getId()
                );

        List<MovieGenre> candidates =
                new ArrayList<>();

        for (MovieGenre genre : genres) {

            candidates.addAll(
                    movieGenreRepository.findByGenre_Id(
                            genre.getGenre().getId()
                    )
            );
        }

        generateRecommendationsFromCandidates(
                user,
                candidates,
                null,
                RecommendationSource.WATCHLIST,
                "Dựa trên phim trong watchlist của bạn",
                context
        );
    }


    private void generateHighRatingRecommendations(User user,
                                                   RecommendationContext context) {
        List<Review> reviews =
                reviewRepository
                        .findByUser_IdAndRatingGreaterThanEqual(
                                user.getId(),
                                BigDecimal.valueOf(4.0)
                        );

        if (reviews.isEmpty()) {
            return;
        }

        Map<Integer, Long> genreFrequency =
                new HashMap<>();

        for (Review review : reviews) {

            List<MovieGenre> genres =
                    movieGenreRepository.findByTmdb_Id(
                            review.getTmdb().getId()
                    );

            for (MovieGenre genre : genres) {

                Integer genreId =
                        genre.getGenre().getId();

                genreFrequency.put(
                        genreId,
                        genreFrequency.getOrDefault(
                                genreId,
                                0L
                        ) + 1
                );
            }
        }

        Integer favoriteGenreId =
                findFavoriteGenreId(
                        genreFrequency
                );

        if (favoriteGenreId == null) {
            return;
        }

        List<MovieGenre> candidates =
                movieGenreRepository.findByGenre_Id(
                        favoriteGenreId
                );

        generateRecommendationsFromCandidates(
                user,
                candidates,
                null,
                RecommendationSource.HIGH_RATING,
                "Dựa trên các phim bạn đánh giá cao",
                context
        );
    }


    private void generateTrendingRecommendations(User user,
                                                 RecommendationContext context) {
        List<Integer> trendingMovieIds =
                viewLogRepository.findTrendingMovieIds(
                        PageRequest.of(0, 20)
                );

        if (trendingMovieIds.isEmpty()) {
            return;
        }

        List<MovieGenre> candidates =
                new ArrayList<>();

        for (Integer movieId : trendingMovieIds) {

            candidates.addAll(
                    movieGenreRepository.findByTmdb_Id(
                            movieId
                    )
            );
        }

        generateRecommendationsFromCandidates(
                user,
                candidates,
                null,
                RecommendationSource.TRENDING,
                "Phim đang thịnh hành trên hệ thống",
                context
        );
    }


    // ---- filters ----

    private boolean isValidRecommendation(
            Movie movie,
            Integer currentMovieId,
            RecommendationContext context) {

        if (Objects.equals(movie.getId(), currentMovieId)) {
            return false;
        }

        if (context.getViewedMovieIds().contains(movie.getId())) {
            return false;
        }

        if (context.getWatchlistMovieIds().contains(movie.getId())) {
            return false;
        }

        if (context.getRecommendedMovieIds().contains(movie.getId())) {
            return false;
        }

        if (context.getAddedMovieIds().contains(movie.getId())) {
            return false;
        }

        return Boolean.TRUE.equals(movie.getIsActive());
    }

    private RecommendationContext buildContext(User user) {

        RecommendationContext context =
                new RecommendationContext();

        context.setViewedMovieIds(
                viewLogRepository.findByUser_Id(user.getId())
                        .stream()
                        .map(v -> v.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        context.setWatchlistMovieIds(
                watchlistRepository.findByUser_Id(user.getId())
                        .stream()
                        .map(w -> w.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        context.setRecommendedMovieIds(new HashSet<>());

        context.setAddedMovieIds(new HashSet<>());

        return context;
    }

    // ---- helpers ----

    private void saveRecommendation(
            User user,
            Movie movie,
            RecommendationSource source,
            String reason) {

        Recommendation recommendation = new Recommendation();

        recommendation.setUser(user);
        recommendation.setTmdb(movie);
        recommendation.setSource(source);
        recommendation.setReason(reason);

        Recommendation saved = recommendationRepository.save(recommendation);

        notificationService.createRecommendationNotification(user, saved);
    }


    private User getCurrentUser() {

        var authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null) {
            throw new ResourceNotFoundException(
                    "User chưa đăng nhập"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy user: " + email
                        )
                );
    }

    private void generateRecommendationsFromCandidates(
            User user,
            List<MovieGenre> candidates,
            Integer currentMovieId,
            RecommendationSource source,
            String reason,
            RecommendationContext context) {

        for (MovieGenre candidate : candidates) {

            Movie movie = candidate.getTmdb();

            if (!isValidRecommendation(
                    movie,
                    currentMovieId,
                    context
            )) {
                continue;
            }

            saveRecommendation(user, movie, source, reason);

            context.getAddedMovieIds().add(movie.getId());

            context.getRecommendedMovieIds().add(movie.getId());

            if (context.getAddedMovieIds().size() >= 20) {
                return;
            }
        }
    }

    private RecommendationDto toDto(
            Recommendation recommendation) {

        RecommendationDto dto = new RecommendationDto();

        dto.setRecommendationId(recommendation.getId());

        dto.setMovieId(recommendation.getTmdb().getId());

        dto.setTitle(recommendation.getTmdb().getTitle());

        dto.setPosterPath(recommendation.getTmdb().getPosterPath());

        dto.setReason(recommendation.getReason());

        dto.setSource(recommendation.getSource().name());
        dto.setCreatedAt(recommendation.getCreatedAt());

        return dto;
    }

    private Integer findFavoriteGenreId(
            Map<Integer, Long> genreFrequency) {

        return genreFrequency.entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

}

