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
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieSearchTools {

    private static final int DEFAULT_RESULT_SIZE = 20;
    private static final int MAX_RESULT_SIZE = 30;
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

        return movieSearchService
                .searchMovies(criteria)
                .getContent();
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