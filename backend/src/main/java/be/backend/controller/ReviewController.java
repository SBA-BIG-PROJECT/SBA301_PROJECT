package be.backend.controller;

import be.backend.model.dto.RatingSummaryDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.request.ReviewRequest;
import be.backend.model.response.PageResponse;
import be.backend.services.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // CREATE — add review to a movie's collection
    @PostMapping("/movies/{movieId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable Integer movieId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(movieId, request));
    }

    // READ (list) — list of reviews for a movie, paginated
    @GetMapping("/movies/{movieId}/reviews")
    public ResponseEntity<PageResponse<ReviewDto>> getReviews(
            @PathVariable Integer movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviews(movieId, page, size));
    }

    // READ (me) - get the current user's review for a movie
    @GetMapping("/movies/{movieId}/reviews/me")
    public ResponseEntity<ReviewDto> getMyReview(@PathVariable Integer movieId) {
        return ResponseEntity.ok(reviewService.getMyReview(movieId));
    }

    // READ (singleton) — aggregate score for a movie (1 movie = 1 average score)
    @GetMapping("/movies/{movieId}/rating")
    public ResponseEntity<RatingSummaryDto> getMovieRating(@PathVariable Integer movieId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(movieId));
    }

    // UPDATE — edit review by id
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable Integer reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    // DELETE — delete review by id
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Integer reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}