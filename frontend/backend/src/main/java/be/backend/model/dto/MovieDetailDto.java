package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

import java.util.List;

@Getter
@Setter
public class MovieDetailDto {
    private Integer id;
    private String title;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private Instant releaseDate;
    private Double voteAverage;
    private Integer voteCount;
    private String trailerUrl;
    private List<GenreDto> genres;
    private List<CastMemberDto> cast;
    private Boolean requiresPremium;
    private Boolean isLocked;
    private String playToken;
    private Boolean requiresLogin;
}