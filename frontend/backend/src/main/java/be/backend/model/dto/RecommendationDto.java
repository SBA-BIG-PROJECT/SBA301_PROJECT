package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class RecommendationDto {

    private Integer movieId;

    private String title;

    private String posterPath;

    private double score;

    private List<String> reasons =
            new ArrayList<>();

    private List<String> sources =
            new ArrayList<>();
}