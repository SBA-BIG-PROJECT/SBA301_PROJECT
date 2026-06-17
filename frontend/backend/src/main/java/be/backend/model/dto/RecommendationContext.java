package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class RecommendationContext {

    private Set<Integer> viewedMovieIds;

    private Set<Integer> watchlistMovieIds;

    private Set<Integer> recommendedMovieIds;

    private Set<Integer> addedMovieIds;
}
