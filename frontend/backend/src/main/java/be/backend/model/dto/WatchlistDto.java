package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
public class WatchlistDto {
    private Integer id;
    private Instant addedAt;
    private Integer movieId;
    private String movieTitle;
    private String posterPath;
    private Instant releaseDate;
    private Double voteAverage;
    private Integer voteCount;
}
