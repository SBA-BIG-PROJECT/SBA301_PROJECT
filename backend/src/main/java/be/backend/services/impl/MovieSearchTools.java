package be.backend.services.impl;

import be.backend.entity.Genre;
import be.backend.entity.Movie;
import be.backend.entity.MovieGenre;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI Tool functions that OpenAI can call via Function Calling.
 * These methods query the real MySQL database and return structured results
 * so the LLM can formulate natural language responses with actual movie data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MovieSearchTools {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final ViewLogRepository viewLogRepository;
    private final ReviewRepository reviewRepository;

    @Tool(description = "Search movies by title keyword. Use this when the user asks to find a specific movie or mentions a movie name.")
    public String searchMoviesByTitle(
            @ToolParam(description = "The movie title or keyword to search for") String keyword) {

        log.info("[AI Tool] searchMoviesByTitle called with keyword: {}", keyword);

        Page<Movie> movies = movieRepository.searchByKeyword(keyword, PageRequest.of(0, 6));

        if (movies.isEmpty()) {
            return "No movies found matching '" + keyword + "'.";
        }

        return movies.getContent().stream()
                .map(m -> formatMovie(m))
                .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Search movies by genre name. Use this when the user asks for movies of a specific genre like 'Action', 'Comedy', 'Horror', 'Romance', 'Drama', 'Sci-Fi', 'Thriller', 'Animation'.")
    public String searchMoviesByGenre(
            @ToolParam(description = "The genre name, e.g. 'Action', 'Comedy', 'Horror', 'Romance', 'Drama', 'Science Fiction', 'Thriller', 'Animation'") String genreName) {

        log.info("[AI Tool] searchMoviesByGenre called with genre: {}", genreName);

        // Find genre by name (case-insensitive partial match)
        List<Genre> allGenres = genreRepository.findAll();
        Genre matchedGenre = allGenres.stream()
                .filter(g -> g.getName().toLowerCase().contains(genreName.toLowerCase()))
                .findFirst()
                .orElse(null);

        if (matchedGenre == null) {
            return "Genre '" + genreName + "' not found. Available genres: " +
                    allGenres.stream().map(Genre::getName).collect(Collectors.joining(", "));
        }

        Page<Movie> movies = movieRepository.findActiveByGenre(
                matchedGenre.getId(), PageRequest.of(0, 6));

        if (movies.isEmpty()) {
            return "No movies found for genre '" + matchedGenre.getName() + "'.";
        }

        return "Genre: " + matchedGenre.getName() + "\n" +
                movies.getContent().stream()
                        .map(m -> formatMovie(m))
                        .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Get trending/popular movies that are most watched recently. Use this when the user asks for trending, popular, hot, or top movies.")
    public String getTrendingMovies() {

        log.info("[AI Tool] getTrendingMovies called");

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        Page<Integer> trendingIds = viewLogRepository.findTrendingMovieIds(
                thirtyDaysAgo, PageRequest.of(0, 6));

        if (trendingIds.isEmpty()) {
            return "No trending data available right now.";
        }

        return trendingIds.getContent().stream()
                .map(id -> movieRepository.findById(id).orElse(null))
                .filter(m -> m != null && m.getIsActive())
                .map(m -> formatMovie(m))
                .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Search movies by actor or director name. Use this when the user mentions an actor or director name.")
    public String searchMoviesByPerson(
            @ToolParam(description = "The actor or director name to search for") String personName) {

        log.info("[AI Tool] searchMoviesByPerson called with person: {}", personName);

        Page<Movie> movies = movieRepository.searchByFilters(
                null, personName, personName, PageRequest.of(0, 6));

        if (movies.isEmpty()) {
            return "No movies found with actor/director '" + personName + "'.";
        }

        return movies.getContent().stream()
                .map(m -> formatMovie(m))
                .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Get all available movie genres in the system. Use this when the user asks what genres are available.")
    public String getAvailableGenres() {

        log.info("[AI Tool] getAvailableGenres called");

        List<Genre> genres = genreRepository.findAll();

        return "Available genres: " +
                genres.stream().map(Genre::getName).collect(Collectors.joining(", "));
    }

    // ---- helper ----
    private String formatMovie(Movie m) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID: ").append(m.getId());
        sb.append(" | Title: ").append(m.getTitle());
        if (m.getPosterPath() != null) {
            sb.append(" | Poster: ").append(m.getPosterPath());
        }
        if (m.getVoteAverage() != null) {
            sb.append(" | Rating: ").append(String.format("%.1f", m.getVoteAverage()));
        }
        if (m.getOverview() != null && !m.getOverview().isEmpty()) {
            String overview = m.getOverview().length() > 150
                    ? m.getOverview().substring(0, 150) + "..."
                    : m.getOverview();
            sb.append(" | Overview: ").append(overview);
        }
        // Include genres
        if (m.getMovieGenres() != null && !m.getMovieGenres().isEmpty()) {
            sb.append(" | Genres: ").append(
                    m.getMovieGenres().stream()
                            .map(mg -> mg.getGenre().getName())
                            .collect(Collectors.joining(", ")));
        }
        return sb.toString();
    }
}
