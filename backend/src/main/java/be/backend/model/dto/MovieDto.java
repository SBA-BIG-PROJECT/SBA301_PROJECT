package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MovieDto {
    private Integer id;
    private String title;
    private String posterPath;
    private LocalDateTime releaseDate;
    private Double voteAverage;
    private Integer voteCount;
}