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

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieSearchTools {

    private static final int DEFAULT_RESULT_SIZE = 20;
    private static final int MAX_RESULT_SIZE = 30;

    private static final String CATEGORY_TRENDING = "trending";
    private static final String CATEGORY_UPCOMING = "upcoming";

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
                Search movies using one complete, self-contained
                natural-language request.

                For a follow-up message, combine the current message with
                relevant earlier conversation context before calling this tool.

                Example:

                Previous user request:
                "Cho tôi phim hack não"

                Current user request:
                "Chỉ lấy phim sau 2020"

                Correct tool input:
                "Cho tôi phim hack não sau 2020"

                Another example:

                Previous user request:
                "Top 10 anime hành động"

                Current user request:
                "Chỉ lấy 5 phim"

                Correct tool input:
                "Top 5 anime hành động"

                Pass the complete reconstructed search request.
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

        Movie movie =
                movieRepository
                        .findFirstByTitleIgnoreCase(title)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Movie not found: " + title
                                )
                        );

        return toDto(movie);

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

        Movie first =
                movieRepository
                        .findFirstByTitleIgnoreCase(movie1)
                        .orElseThrow();

        Movie second =
                movieRepository
                        .findFirstByTitleIgnoreCase(movie2)
                        .orElseThrow();

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
}