package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class WatchlistDto {
    private Integer id;
    private Instant addedAt;
    private Integer movieId;
    private String movieTitle;
    private String posterPath;
    private LocalDate releaseDate;
    private Double voteAverage;
    private Integer voteCount;
}
