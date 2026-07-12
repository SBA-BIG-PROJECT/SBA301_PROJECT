package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class AiMovieDto {

    private Integer id;

    private String title;

    private String overview;

    private String posterPath;

    private String backdropPath;

    private Instant releaseDate;

    private Double voteAverage;

    private Integer voteCount;

    private Boolean premium;

    private List<String> genres;

    private List<String> categories;

    private List<String> actors;

    private List<String> directors;
}
