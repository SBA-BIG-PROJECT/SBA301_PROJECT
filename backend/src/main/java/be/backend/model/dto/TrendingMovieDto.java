package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TrendingMovieDto {

    private Integer movieId;

    private String title;

    private String posterPath;

    private Double voteAverage;

    private LocalDate releaseDate;
}