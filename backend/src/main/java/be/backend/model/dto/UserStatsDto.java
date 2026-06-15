package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {
    private Long totalReviews;
    private Long totalWatchlistItems;
    private Long totalViewedMovies;
    private Double averageRating;
    private Long accountAgeDays;
}
