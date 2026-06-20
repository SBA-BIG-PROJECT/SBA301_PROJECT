package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
public class ViewHistoryDto {
    private Integer id;
    private Instant watchedAt;
    private Integer watchDuration;
    private Integer movieId;
    private String movieTitle;
    private String posterPath;
    private String overview;
    private LocalDateTime releaseDate;
    private Double voteAverage;
    private Integer voteCount;
}
