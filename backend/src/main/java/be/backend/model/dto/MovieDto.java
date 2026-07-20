package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;


@Getter
@Setter
public class MovieDto {
    private Integer id;
    private String title;
    private String posterPath;
    private Instant releaseDate;
    private Double voteAverage;
    private Integer voteCount;
    private Boolean isPremium;

}