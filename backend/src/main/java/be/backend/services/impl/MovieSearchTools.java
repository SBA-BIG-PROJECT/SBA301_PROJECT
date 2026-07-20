package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.MovieIntentMapper;
import be.backend.model.dto.AiMovieDto;
import be.backend.model.dto.MovieSearchCriteria;
import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.services.MovieSearchService;
import be.backend.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieSearchTools {

    private static final int DEFAULT_RESULT_SIZE = 20;
    private static final int MAX_RESULT_SIZE = 30;
    private static final int GENERIC_TOP_SIZE = 10;
    private static final double GOOD_RATING_THRESHOLD = 7.5;

    private static final int SCORE_SHARED_GENRE = 4;
    private static final int SCORE_SHARED_DIRECTOR = 3;
    private static final int SCORE_SHARED_ACTOR = 2;
    private static final int SCORE_GOOD_RATING = 1;
    private static final int SCORE_TRENDING = 1;

    private static final String CATEGORY_TRENDING = "trending";
    private static final String CATEGORY_UPCOMING = "upcoming";
    private static final String ROLE_ACTOR = "ACTOR";
    private static final String ROLE_DIRECTOR = "DIRECTOR";

    private static final List<String> CONTEXT_OVERRIDE_CUES = List.of(
            "thoi",
            "thôi",
            "doi sang",
            "đổi sang",
            "chi",
            "chỉ",
            "instead",
            "only"
    );

    private static final List<String> BROAD_QUERY_HINTS = List.of(
            "phim",
            "movie",
            "anime",
            "animation",
            "hài",
            "comedy",
            "hành động",
            "action",
            "kinh dị",
            "horror",
            "nhật",
            "japan"
    );

    private static final Map<String, String> GENRE_KEYWORD_TO_CANONICAL =
            new LinkedHashMap<>();

    static {
        GENRE_KEYWORD_TO_CANONICAL.put("hành động", "Action");
        GENRE_KEYWORD_TO_CANONICAL.put("action", "Action");
        GENRE_KEYWORD_TO_CANONICAL.put("kinh dị", "Horror");
        GENRE_KEYWORD_TO_CANONICAL.put("horror", "Horror");
        GENRE_KEYWORD_TO_CANONICAL.put("hài", "Comedy");
        GENRE_KEYWORD_TO_CANONICAL.put("comedy", "Comedy");
        GENRE_KEYWORD_TO_CANONICAL.put("animation", "Animation");
        GENRE_KEYWORD_TO_CANONICAL.put("anime", "Animation");
        GENRE_KEYWORD_TO_CANONICAL.put("tình cảm", "Romance");
        GENRE_KEYWORD_TO_CANONICAL.put("romance", "Romance");
        GENRE_KEYWORD_TO_CANONICAL.put("phiêu lưu", "Adventure");
        GENRE_KEYWORD_TO_CANONICAL.put("adventure", "Adventure");
        GENRE_KEYWORD_TO_CANONICAL.put("mystery", "Mystery");
        GENRE_KEYWORD_TO_CANONICAL.put("bí ẩn", "Mystery");
        GENRE_KEYWORD_TO_CANONICAL.put("drama", "Drama");
        GENRE_KEYWORD_TO_CANONICAL.put("tâm lý", "Drama");
    }

    private final MovieSearchService movieSearchService;
    private final RecommendationService recommendationService;
    private final MovieRepository movieRepository;
    private final MovieIntentMapper movieIntentMapper;

    /*
     * =========================================================
     * SEARCH MOVIES
     * =========================================================
     */

    @Tool(
            name = "searchMovies",
            description = """
                Search movies using one complete natural-language request.

                Use this tool for:
                - movie titles
                - actor or director names
                - franchises
                - adaptations
                - genres
                - moods
                - release years
                - ratings
                - combined conditions

                Examples:
                - "Interstellar"
                - "Chí Phèo"
                - "Tom Cruise"
                - "Phim của Victory Vũ"
                - "Có phim nào liên quan đến Chí Phèo không?"
                - "Top 5 anime hành động sau năm 2020 điểm trên 8"

                For follow-up messages, combine the current request with
                relevant conversation context and pass one complete,
                self-contained request.

                The final assistant response must follow [AI_MOVIES] format.
                For movie lists, output one [AI_MOVIES] JSON block with items containing only:
                - id
                - reason

                Do not output movie metadata in plain text outside the JSON block
                (title, actors, directors, genres, release date, rating, overview,
                poster URL, trailer URL).

                If the result is empty, do not invent movies.
                """
    )
    public List<AiMovieDto> searchMoviesByIntent(
            @ToolParam(
                    description = """
                        Complete self-contained movie search request,
                        including relevant previous conversation context.
                        """
            )
            String request) {

        MovieSearchCriteria criteria =
                movieIntentMapper.map(request);

        criteria.setActive(true);

        normalizePaging(criteria);

        applyGenericTopPreference(criteria, request);

        List<AiMovieDto> movies = movieSearchService
                .searchMovies(criteria)
                .getContent();

        if (!movies.isEmpty()) {
            return movies;
        }

        // For broad queries, return closest top results instead of hard no-result.
        if (isBroadMovieQuery(request, criteria)) {
            return tryBroadFallback(criteria, request, movies);
        }

        if (!shouldRelaxStaleGenreContext(criteria, request)) {
            return movies;
        }

        String preferredGenre = detectPreferredGenreFromRequest(
                request,
                criteria.getGenres()
        );

        if (preferredGenre == null) {
            return tryBroadFallback(criteria, request, movies);
        }

        criteria.setGenres(List.of(preferredGenre));

        List<AiMovieDto> relaxedMovies = movieSearchService
                .searchMovies(criteria)
                .getContent();

        return tryBroadFallback(criteria, request, relaxedMovies);
    }

    /*
     * =========================================================
     * PERSONALIZED RECOMMENDATION
     * =========================================================
     */

    @Tool(
            name = "recommendForCurrentUser",
            description = """
                    Return personalized movie recommendations for the currently
                    authenticated user.

                    Use this tool when the user asks for recommendations without
                    providing specific search filters.

                    Example requests:
                    - "Gợi ý phim cho tôi"
                    - "Tôi nên xem gì?"
                    - "Có phim nào hợp gu tôi không?"
                    - "Recommend something for me"
                    - "What should I watch?"

                    Recommendations are calculated in real time from the user's:
                    - viewing history
                    - watchlist
                    - highly rated movies
                    - preferred genres
                    - preferred actors or directors
                    - similar users' viewing behavior
                    - trending movies

                    Do NOT use searchMovies as a replacement for personalized
                    recommendations.

                    The final assistant response must use [AI_MOVIES] for movie lists,
                    where each item contains only id and reason.

                    Do not list movie metadata in plain text outside the JSON block.
                    """
    )
    public PageResponse<RecommendationDto> recommendForCurrentUser() {

        return recommendationService.getRecommendations(
                0,
                DEFAULT_RESULT_SIZE
        );
    }

    /*
     * =========================================================
     * MOVIE DETAIL
     * =========================================================
     */

    @Tool(
            name = "getMovieDetail",
            description = """
Get detailed information about one movie.

Use when the user asks:

- movie overview
- plot
- cast
- director
- rating
- premium
- release date

Input should be the movie title.
"""
    )
    public AiMovieDto getMovieDetail(

            @ToolParam(
                    description = "Movie title."
            )
            String title
    ) {

        Movie movie = resolveMovieByTitle(title);

        return toDto(movie);

    }

    @Tool(
            name = "findSimilarMovies",
            description = """
Return movies similar to a given reference movie title.

Similarity score is based on:
- shared genre
- shared director
- shared actor
- good rating
- trending category

Exclude the reference movie itself and return ranked candidates.

The final assistant response for this list must use [AI_MOVIES],
with each item containing only id and reason.

Do not list movie metadata in plain text outside the JSON block.
"""
    )
    public List<AiMovieDto> findSimilarMovies(

            @ToolParam(
                    description = "Reference movie title."
            )
            String movieTitle
    ) {

        Movie sourceMovie = resolveMovieByTitle(movieTitle);

        Set<Integer> sourceGenreIds = extractGenreIds(sourceMovie);
        Set<Integer> sourceDirectorIds = extractPersonIdsByRole(sourceMovie, ROLE_DIRECTOR);
        Set<Integer> sourceActorIds = extractPersonIdsByRole(sourceMovie, ROLE_ACTOR);

        return movieRepository
                .findTop200ByIsActiveTrueOrderByVoteCountDesc()
                .stream()
                .filter(candidate -> !candidate.getId().equals(sourceMovie.getId()))
                .map(candidate -> new SimilarityCandidate(
                        candidate,
                        calculateSimilarityScore(
                                candidate,
                                sourceGenreIds,
                                sourceDirectorIds,
                                sourceActorIds
                        )
                ))
                .filter(candidate -> candidate.score() > 0)
                .sorted(
                        Comparator
                                .comparingInt(SimilarityCandidate::score)
                                .reversed()
                                .thenComparing(
                                        similarity -> {
                                            Double rating = similarity.movie().getVoteAverage();
                                            return rating == null ? 0.0 : rating;
                                        },
                                        Comparator.reverseOrder()
                                )
                                .thenComparing(
                                        similarity -> {
                                            Integer voteCount = similarity.movie().getVoteCount();
                                            return voteCount == null ? 0 : voteCount;
                                        },
                                        Comparator.reverseOrder()
                                )
                )
                .limit(DEFAULT_RESULT_SIZE)
                .map(similarity -> toDto(similarity.movie()))
                .toList();
    }

    /*
     * =========================================================
     * TRENDING MOVIES
     * =========================================================
     */

    @Tool(
            name = "getTrendingMovies",
            description = """
                    Return movies categorized as currently trending in the SBA
                    Movies database.

                    Use this tool only when the user asks for:
                    - trending movies
                    - hot movies
                    - movies popular right now
                    - movies people are currently interested in
                    - phim xu hướng
                    - phim đang hot

                    Do not use this tool for personalized recommendations.

                    The final assistant response must not list movie metadata
                    such as titles, actors, directors, ratings, genres, dates,
                    or overviews in plain text.

                    Return movie references using the required [AI_MOVIES]
                    format, where each item contains only id and reason.
                    """
    )
    public List<AiMovieDto> getTrendingMovies() {

        MovieSearchCriteria criteria =
                createCategoryCriteria(
                        CATEGORY_TRENDING,
                        "popular",
                        true
                );

        return movieSearchService
                .searchMovies(criteria)
                .getContent();
    }

    /*
     * =========================================================
     * UPCOMING MOVIES
     * =========================================================
     */

    @Tool(
            name = "getUpcomingMovies",
            description = """
                    Return movies categorized as upcoming in the SBA Movies
                    database.

                    Use this tool when the user asks for:
                    - upcoming movies
                    - coming soon movies
                    - movies that will be released soon
                    - phim sắp chiếu
                    - phim chuẩn bị ra mắt

                    Do not treat every movie released in the current year as an
                    upcoming movie.

                    The final assistant response must use [AI_MOVIES] for movie lists,
                    with each item containing only id and reason.

                    Do not output movie metadata in plain text outside the JSON block.
                    """
    )
    public List<AiMovieDto> getUpcomingMovies() {

        MovieSearchCriteria criteria =
                createCategoryCriteria(
                        CATEGORY_UPCOMING,
                        "release",
                        false
                );

        return movieSearchService
                .searchMovies(criteria)
                .getContent();
    }

    /*
     * =========================================================
     * COMPARE MOVIES
     * =========================================================
     */

    @Tool(
            name="compareMovies",
            description="""
Compare two movies.

Input should be two movie titles.
"""
    )
    public List<AiMovieDto> compareMovies(

            @ToolParam(
                    description = "First movie title."
            )
            String movie1,

            @ToolParam(
                    description = "Second movie title."
            )
            String movie2
    ){

        Movie first = resolveMovieByTitle(movie1);
        Movie second = resolveMovieByTitle(movie2);

        return List.of(
                toDto(first),
                toDto(second)
        );

    }

    /*
     * =========================================================
     * HELPERS
     * =========================================================
     */

    private MovieSearchCriteria createCategoryCriteria(
            String category,
            String sortBy,
            boolean descending) {

        MovieSearchCriteria criteria =
                new MovieSearchCriteria();

        criteria.setCategories(
                List.of(category)
        );

        criteria.setActive(true);
        criteria.setSortBy(sortBy);
        criteria.setDescending(descending);
        criteria.setPage(0);
        criteria.setSize(DEFAULT_RESULT_SIZE);

        return criteria;
    }

    private void normalizePaging(
            MovieSearchCriteria criteria) {

        if (criteria.getPage() == null ||
                criteria.getPage() < 0) {

            criteria.setPage(0);
        }

        if (criteria.getSize() == null ||
                criteria.getSize() <= 0) {

            criteria.setSize(DEFAULT_RESULT_SIZE);
        }

        if (criteria.getSize() > MAX_RESULT_SIZE) {
            criteria.setSize(MAX_RESULT_SIZE);
        }
    }

    private void applyGenericTopPreference(
            MovieSearchCriteria criteria,
            String request
    ) {

        if (!isBroadMovieQuery(request, criteria)) {
            return;
        }

        if (criteria.getSize() == null
                || criteria.getSize() == DEFAULT_RESULT_SIZE) {
            criteria.setSize(GENERIC_TOP_SIZE);
        }

        if (!hasText(criteria.getSortBy())) {
            criteria.setSortBy("popular");
            criteria.setDescending(true);
        }
    }

    private boolean shouldRelaxStaleGenreContext(
            MovieSearchCriteria criteria,
            String request
    ) {

        if (criteria == null
                || criteria.getGenres() == null
                || criteria.getGenres().size() <= 1) {

            return false;
        }

        if (hasText(criteria.getTitle())
                || hasText(criteria.getPerson())
                || hasText(criteria.getKeyword())) {

            return false;
        }

        String lowered = request == null
                ? ""
                : request.toLowerCase(Locale.ROOT);

        return CONTEXT_OVERRIDE_CUES.stream()
                .anyMatch(lowered::contains);
    }

    private List<AiMovieDto> tryBroadFallback(
            MovieSearchCriteria criteria,
            String request,
            List<AiMovieDto> currentMovies
    ) {

        if (currentMovies != null && !currentMovies.isEmpty()) {
            return currentMovies;
        }

        if (!isBroadMovieQuery(request, criteria)) {
            return currentMovies;
        }

        MovieSearchCriteria fallback =
                MovieSearchCriteria.builder()
                        .active(true)
                        .page(0)
                        .size(resolveFallbackSize(criteria))
                        .sortBy("popular")
                        .descending(true)
                        .build();

        if (criteria.getGenres() != null
                && !criteria.getGenres().isEmpty()) {
            fallback.setGenres(List.of(criteria.getGenres().get(0)));
        }

        fallback.setCountry(criteria.getCountry());

        fallback.setReleaseYear(criteria.getReleaseYear());
        fallback.setReleaseFrom(criteria.getReleaseFrom());
        fallback.setReleaseTo(criteria.getReleaseTo());

        return movieSearchService
                .searchMovies(fallback)
                .getContent();
    }

    private int resolveFallbackSize(
            MovieSearchCriteria criteria
    ) {

        if (criteria.getSize() == null
                || criteria.getSize() <= 0) {
            return GENERIC_TOP_SIZE;
        }

        return Math.min(criteria.getSize(), GENERIC_TOP_SIZE);
    }

    private boolean isBroadMovieQuery(
            String request,
            MovieSearchCriteria criteria
    ) {

        if (request == null || request.isBlank()) {
            return false;
        }

        if (hasText(criteria.getTitle())
                || hasText(criteria.getPerson())) {
            return false;
        }

        String lowered = request.toLowerCase(Locale.ROOT).trim();

        boolean hasHint = BROAD_QUERY_HINTS.stream()
                .anyMatch(lowered::contains);

        if (!hasHint) {
            return false;
        }

        String[] tokens = lowered.split("\\s+");

        return tokens.length <= 8;
    }

    private String detectPreferredGenreFromRequest(
            String request,
            List<String> genres
    ) {

        if (request == null
                || request.isBlank()
                || genres == null
                || genres.isEmpty()) {

            return null;
        }

        String lowered = request.toLowerCase(Locale.ROOT);
        int bestIndex = -1;
        String bestGenre = null;

        for (Map.Entry<String, String> entry : GENRE_KEYWORD_TO_CANONICAL.entrySet()) {

            int keywordIndex = lowered.lastIndexOf(entry.getKey());

            if (keywordIndex < 0) {
                continue;
            }

            for (String genre : genres) {

                if (!entry.getValue().equalsIgnoreCase(genre)) {
                    continue;
                }

                if (keywordIndex > bestIndex) {
                    bestIndex = keywordIndex;
                    bestGenre = genre;
                }
            }
        }

        if (bestGenre != null) {
            return bestGenre;
        }

        return genres.get(genres.size() - 1);
    }

    private boolean hasText(String value) {

        return value != null
                && !value.isBlank();
    }

    private int calculateSimilarityScore(
            Movie candidate,
            Set<Integer> sourceGenreIds,
            Set<Integer> sourceDirectorIds,
            Set<Integer> sourceActorIds
    ) {

        int score = 0;

        if (hasAnyIntersection(
                sourceGenreIds,
                extractGenreIds(candidate)
        )) {
            score += SCORE_SHARED_GENRE;
        }

        if (hasAnyIntersection(
                sourceDirectorIds,
                extractPersonIdsByRole(candidate, ROLE_DIRECTOR)
        )) {
            score += SCORE_SHARED_DIRECTOR;
        }

        if (hasAnyIntersection(
                sourceActorIds,
                extractPersonIdsByRole(candidate, ROLE_ACTOR)
        )) {
            score += SCORE_SHARED_ACTOR;
        }

        if (candidate.getVoteAverage() != null
                && candidate.getVoteAverage() >= GOOD_RATING_THRESHOLD) {
            score += SCORE_GOOD_RATING;
        }

        if (isTrendingMovie(candidate)) {
            score += SCORE_TRENDING;
        }

        return score;
    }

    private Set<Integer> extractGenreIds(Movie movie) {

        return movie.getMovieGenres()
                .stream()
                .map(movieGenre -> movieGenre.getGenre().getId())
                .collect(java.util.stream.Collectors.toSet());
    }

    private Set<Integer> extractPersonIdsByRole(
            Movie movie,
            String role
    ) {

        return movie.getMoviePeople()
                .stream()
                .filter(moviePerson -> role.equalsIgnoreCase(moviePerson.getRole()))
                .map(moviePerson -> moviePerson.getPerson().getId())
                .collect(java.util.stream.Collectors.toSet());
    }

    private boolean hasAnyIntersection(
            Set<Integer> source,
            Set<Integer> candidate
    ) {

        if (source.isEmpty() || candidate.isEmpty()) {
            return false;
        }

        Set<Integer> overlap = new HashSet<>(source);
        overlap.retainAll(candidate);

        return !overlap.isEmpty();
    }

    private boolean isTrendingMovie(Movie movie) {

        return movie.getMovieCategories()
                .stream()
                .map(movieCategory -> movieCategory.getCategory().getName())
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.toLowerCase(Locale.ROOT))
                .anyMatch(name -> name.contains(CATEGORY_TRENDING));
    }

    private Movie resolveMovieByTitle(String title) {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "Movie title must not be blank"
            );
        }

        String normalizedTitle = title.trim();

        return movieRepository
                .findFirstByTitleIgnoreCaseAndIsActiveTrue(normalizedTitle)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Movie not found: " + normalizedTitle
                        )
                );
    }

    private Movie findMovieById(
            Integer movieId) {

        if (movieId == null) {
            throw new IllegalArgumentException(
                    "Movie ID must not be null"
            );
        }

        return movieRepository
                .findById(movieId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Movie not found: " + movieId
                        )
                );
    }

    private AiMovieDto toDto(
            Movie movie) {

        AiMovieDto dto =
                new AiMovieDto();

        dto.setId(movie.getId());
        dto.setTitle(movie.getTitle());
        dto.setOverview(movie.getOverview());
        dto.setPosterPath(movie.getPosterPath());
        dto.setReleaseDate(movie.getReleaseDate());
        dto.setVoteAverage(movie.getVoteAverage());
        dto.setVoteCount(movie.getVoteCount());
        dto.setPremium(movie.getIsPremium());

        dto.setGenres(
                movie.getMovieGenres()
                        .stream()
                        .map(movieGenre ->
                                movieGenre
                                        .getGenre()
                                        .getName()
                        )
                        .distinct()
                        .toList()
        );

        dto.setCategories(
                movie.getMovieCategories()
                        .stream()
                        .map(movieCategory ->
                                movieCategory
                                        .getCategory()
                                        .getName()
                        )
                        .distinct()
                        .toList()
        );

        dto.setActors(
                movie.getMoviePeople()
                        .stream()
                        .filter(moviePerson ->
                                "ACTOR".equalsIgnoreCase(
                                        moviePerson.getRole()
                                )
                        )
                        .map(moviePerson ->
                                moviePerson
                                        .getPerson()
                                        .getName()
                        )
                        .distinct()
                        .toList()
        );

        dto.setDirectors(
                movie.getMoviePeople()
                        .stream()
                        .filter(moviePerson ->
                                "DIRECTOR".equalsIgnoreCase(
                                        moviePerson.getRole()
                                )
                        )
                        .map(moviePerson ->
                                moviePerson
                                        .getPerson()
                                        .getName()
                        )
                        .distinct()
                        .toList()
        );

        return dto;
    }

    private record SimilarityCandidate(
            Movie movie,
            int score
    ) {
    }
}