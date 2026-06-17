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

    // CREATE — thêm review vào collection của 1 phim
    @PostMapping("/movies/{movieId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable Integer movieId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(movieId, request));
    }

    // READ (list) — danh sách review của 1 phim, phân trang
    @GetMapping("/movies/{movieId}/reviews")
    public ResponseEntity<PageResponse<ReviewDto>> getReviews(
            @PathVariable Integer movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviews(movieId, page, size));
    }

    // READ (singleton) — điểm tổng hợp của phim (1 phim = 1 điểm TB)
    @GetMapping("/movies/{movieId}/rating")
    public ResponseEntity<RatingSummaryDto> getMovieRating(@PathVariable Integer movieId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(movieId));
    }

    // UPDATE — sửa review theo id
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable Integer reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request));
    }

    // DELETE — xóa review theo id
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Integer reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}