package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
public class TrendingMovieDto {

    private Integer movieId;

    private String title;

    private String posterPath;

    private Double voteAverage;

    private Instant releaseDate;
}