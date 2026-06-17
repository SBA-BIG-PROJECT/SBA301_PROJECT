package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class MovieDetailDto {
    private Integer id;
    private String title;
    private String overview;
    private String posterPath;
    private String backdropPath;
    private LocalDate releaseDate;
    private Double voteAverage;
    private Integer voteCount;
    private String trailerUrl;
    private List<GenreDto> genres;
    private List<CastMemberDto> cast;
}