package be.backend.services;

import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;


public interface RecommendationService {
    PageResponse<RecommendationDto> getRecommendations(int page, int size);
}

