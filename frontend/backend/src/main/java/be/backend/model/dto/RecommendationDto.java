package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class RecommendationDto {
    private Integer recommendationId;
    private Integer movieId;
    private String title;
    private String posterPath;
    private String source;
    private String reason;
    private Instant createdAt;
}

