package be.backend.model.dto;

import be.backend.entity.Movie;
import be.backend.enums.RecommendationSource;
import lombok.Getter;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
public class RecommendationCandidate {

    private Movie movie;

    private double score = 0;

    private Set<String> reasons = new LinkedHashSet<>();
    private Set<RecommendationSource> sources = new LinkedHashSet<>();

}