package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MovieDto {
    private Integer id;
    private String title;
    private String posterPath;
    private LocalDate releaseDate;
    private Double voteAverage;
    private Integer voteCount;
}