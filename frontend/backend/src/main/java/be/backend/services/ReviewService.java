package be.backend.services;

import be.backend.model.dto.RatingSummaryDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.request.ReviewRequest;
import be.backend.model.response.PageResponse;

public interface ReviewService {
    ReviewDto createReview(Integer movieId, ReviewRequest request);
    PageResponse<ReviewDto> getReviews(Integer movieId, int page, int size);
    RatingSummaryDto getRatingSummary(Integer movieId);
    ReviewDto updateReview(Integer reviewId, ReviewRequest request);
    void deleteReview(Integer reviewId);
}