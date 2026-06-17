package be.backend.services;

import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;

import java.util.List;

public interface RecommendationService {
    PageResponse<RecommendationDto> getRecommendations(
            int page,
            int size
    );

    void generateRecommendations();

    void generateRecommendations(Integer userId);

    void deleteRecommendation(Integer recommendationId);

}

