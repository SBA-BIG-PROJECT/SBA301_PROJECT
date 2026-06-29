package be.backend.services.impl;

import be.backend.entity.*;
import be.backend.enums.RecommendationSource;
import be.backend.exception.ResourceNotFoundException;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final MovieGenreRepository movieGenreRepository;
    private final ViewLogRepository viewLogRepository;
    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final MoviePersonRepository moviePersonRepository;

    // ================================
    // MAIN API
    // ================================
    @Override
    @Transactional(readOnly = true)
    public PageResponse<RecommendationDto> getRecommendations(int page, int size) {

        User user = getCurrentUser();

        RecommendationContext context = buildContext(user);

        List<RecommendationDto> results = new ArrayList<>();

        generateContentBased(user, context, results);
        generateViewHistory(user, context, results);
        generateWatchlist(user, context, results);
        generateHighRating(user, context, results);
        generateActorDirector(user, context, results);
        generateAssociation(user, context, results);

        // Pagination
        int start = Math.min(page * size, results.size());
        int end = Math.min(start + size, results.size());

        List<RecommendationDto> pageContent = results.subList(start, end);

        return PageResponse.from(
                new PageImpl<>(pageContent, PageRequest.of(page, size), results.size())
        );
    }

    // ================================
    // ALGORITHMS
    // ================================

    private void generateContentBased(User user, RecommendationContext context, List<RecommendationDto> results) {

        ViewLog latest = viewLogRepository
                .findTopByUser_IdOrderByWatchedAtDesc(user.getId())
                .orElse(null);

        if (latest == null) return;

        List<MovieGenre> genres = movieGenreRepository.findByTmdb_Id(latest.getTmdb().getId());

        for (MovieGenre g : genres) {
            List<MovieGenre> candidates = movieGenreRepository.findByGenre_Id(g.getGenre().getId());

            addCandidates(
                    candidates,
                    latest.getTmdb().getId(),
                    "Similar to " + latest.getTmdb().getTitle(),
                    RecommendationSource.CONTENT_BASED,
                    context,
                    results
            );
        }
    }

    private void generateViewHistory(User user, RecommendationContext context, List<RecommendationDto> results) {

        List<ViewLog> logs = viewLogRepository.findTop20ByUser_IdOrderByWatchedAtDesc(user.getId());

        if (logs.isEmpty()) return;

        Map<Integer, Long> freq = new HashMap<>();

        for (ViewLog log : logs) {
            List<MovieGenre> genres = movieGenreRepository.findByTmdb_Id(log.getTmdb().getId());

            for (MovieGenre g : genres) {
                Integer id = g.getGenre().getId();
                freq.put(id, freq.getOrDefault(id, 0L) + 1);
            }
        }

        Integer fav = findTopGenre(freq);
        if (fav == null) return;

        List<MovieGenre> candidates = movieGenreRepository.findByGenre_Id(fav);

        addCandidates(candidates, null, "Based on your history", RecommendationSource.VIEW_HISTORY, context, results);
    }

    private void generateWatchlist(User user, RecommendationContext context, List<RecommendationDto> results) {

        Watchlist latest = watchlistRepository
                .findTopByUser_IdOrderByAddedAtDesc(user.getId())
                .orElse(null);

        if (latest == null) return;

        List<MovieGenre> genres = movieGenreRepository.findByTmdb_Id(latest.getTmdb().getId());

        for (MovieGenre g : genres) {
            List<MovieGenre> candidates = movieGenreRepository.findByGenre_Id(g.getGenre().getId());

            addCandidates(candidates, null, "From your watchlist", RecommendationSource.WATCHLIST, context, results);
        }
    }

    private void generateHighRating(User user, RecommendationContext context, List<RecommendationDto> results) {

        List<Review> reviews = reviewRepository
                .findByUser_IdAndRatingGreaterThanEqual(user.getId(), BigDecimal.valueOf(4));

        if (reviews.isEmpty()) return;

        Map<Integer, Long> freq = new HashMap<>();

        for (Review r : reviews) {
            List<MovieGenre> genres = movieGenreRepository.findByTmdb_Id(r.getTmdb().getId());

            for (MovieGenre g : genres) {
                Integer id = g.getGenre().getId();
                freq.put(id, freq.getOrDefault(id, 0L) + 1);
            }
        }

        Integer fav = findTopGenre(freq);
        if (fav == null) return;

        List<MovieGenre> candidates = movieGenreRepository.findByGenre_Id(fav);

        addCandidates(candidates, null, "Based on your ratings", RecommendationSource.HIGH_RATING, context, results);
    }

    private void generateActorDirector(User user, RecommendationContext context, List<RecommendationDto> results) {

        ViewLog latest = viewLogRepository
                .findTopByUser_IdOrderByWatchedAtDesc(user.getId())
                .orElse(null);

        if (latest == null) return;

        List<MoviePerson> people = moviePersonRepository.findByTmdb_Id(latest.getTmdb().getId());

        List<Integer> personIds = people.stream()
                .map(p -> p.getPerson().getId())
                .distinct()
                .toList();

        List<MoviePerson> related = moviePersonRepository.findByPersonIds(personIds);

        List<MovieGenre> candidates = new ArrayList<>();

        for (MoviePerson mp : related) {
            MovieGenre fake = new MovieGenre();
            fake.setTmdb(mp.getTmdb());
            candidates.add(fake);
        }

        addCandidates(
                candidates,
                latest.getTmdb().getId(),
                "Same actor/director",
                RecommendationSource.ACTOR_DIRECTOR,
                context,
                results
        );
    }

    private void generateAssociation(User user, RecommendationContext context, List<RecommendationDto> results) {

        ViewLog latest = viewLogRepository
                .findTopByUser_IdOrderByWatchedAtDesc(user.getId())
                .orElse(null);

        if (latest == null) return;

        Integer movieId = latest.getTmdb().getId();

        List<Integer> userIds = viewLogRepository.findUserIdsByMovieId(movieId);
        if (userIds.isEmpty()) return;

        List<Integer> movieIds = viewLogRepository.findPopularMoviesByUsers(userIds, PageRequest.of(0, 50));

        List<MovieGenre> candidates = new ArrayList<>();

        for (Integer id : movieIds) {
            movieGenreRepository.findByTmdb_Id(id)
                    .stream()
                    .findFirst()
                    .ifPresent(candidates::add);
        }

        addCandidates(candidates, movieId, "People also watch", RecommendationSource.ASSOCIATION_RULE, context, results);
    }

    // ================================
    // CORE LOGIC
    // ================================

    private void addCandidates(
            List<MovieGenre> candidates,
            Integer currentId,
            String reason,
            RecommendationSource source,
            RecommendationContext context,
            List<RecommendationDto> results
    ) {

        for (MovieGenre mg : candidates) {

            Movie movie = mg.getTmdb();

            if (!isValid(movie, currentId, context)) continue;

            RecommendationDto dto = new RecommendationDto();
            dto.setMovieId(movie.getId());
            dto.setTitle(movie.getTitle());
            dto.setPosterPath(movie.getPosterPath());
            dto.setReason(reason);
            dto.setSource(source.name());

            results.add(dto);

            context.getAddedMovieIds().add(movie.getId());

            if (results.size() >= 50) return;
        }
    }

    private boolean isValid(Movie movie, Integer currentId, RecommendationContext context) {

        if (Objects.equals(movie.getId(), currentId)) return false;
        if (context.getViewedMovieIds().contains(movie.getId())) return false;
        if (context.getWatchlistMovieIds().contains(movie.getId())) return false;
        if (context.getAddedMovieIds().contains(movie.getId())) return false;

        return Boolean.TRUE.equals(movie.getIsActive());
    }

    private RecommendationContext buildContext(User user) {

        RecommendationContext ctx = new RecommendationContext();

        ctx.setViewedMovieIds(
                viewLogRepository.findByUser_Id(user.getId())
                        .stream()
                        .map(v -> v.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        ctx.setWatchlistMovieIds(
                watchlistRepository.findByUser_Id(user.getId())
                        .stream()
                        .map(w -> w.getTmdb().getId())
                        .collect(Collectors.toSet())
        );

        ctx.setAddedMovieIds(new HashSet<>());

        return ctx;
    }

    private Integer findTopGenre(Map<Integer, Long> map) {
        return map.entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private User getCurrentUser() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}