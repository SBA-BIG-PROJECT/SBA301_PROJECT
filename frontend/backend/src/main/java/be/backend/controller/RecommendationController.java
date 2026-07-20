package be.backend.controller;

import be.backend.model.dto.RecommendationDto;
import be.backend.model.response.PageResponse;
import be.backend.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<PageResponse<RecommendationDto>>
    getRecommendations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(recommendationService.getRecommendations(page, size)
        );
    }

}