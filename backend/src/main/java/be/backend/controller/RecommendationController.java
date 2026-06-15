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

    @PostMapping("/generate")
    public ResponseEntity<Void> generate() {
        recommendationService.generateRecommendations();
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<PageResponse<RecommendationDto>>
    getRecommendations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(recommendationService.getRecommendations(page, size)
        );
    }

    @DeleteMapping("/{recommendationId}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer recommendationId) {
        recommendationService.deleteRecommendation(recommendationId);
        return ResponseEntity.noContent().build();
    }
}