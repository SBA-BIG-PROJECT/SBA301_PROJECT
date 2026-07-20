package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class RecommendationContext {

    private Set<Integer> viewedMovieIds =
            new HashSet<>();

    private Set<Integer> watchlistMovieIds =
            new HashSet<>();
}