package be.backend.model.dto;

import lombok.Getter;

@Getter
public class RatingSummaryDto {
    private final double average;
    private final long count;

    public RatingSummaryDto(Double average, Long count) {
        this.average = average == null ? 0.0 : Math.round(average * 10.0) / 10.0;
        this.count = count == null ? 0L : count;
    }
}