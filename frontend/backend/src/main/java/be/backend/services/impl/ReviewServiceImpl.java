package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.entity.Review;
import be.backend.entity.User;
import be.backend.exception.DuplicateReviewException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.RatingSummaryDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.request.ReviewRequest;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.repository.ReviewRepository;
import be.backend.repository.UserRepository;
import be.backend.services.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewDto createReview(Integer movieId, ReviewRequest request) {
        User user = getCurrentUser();
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim id=" + movieId));

        if (reviewRepository.existsByTmdb_IdAndUser_Id(movieId, user.getId())) {
            throw new DuplicateReviewException("Bạn đã đánh giá phim này rồi. Hãy sửa đánh giá cũ.");
        }

        Review review = new Review();
        review.setUser(user);
        review.setTmdb(movie);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(Instant.now());   // bắt buộc set vì ColumnDefault chỉ dùng cho DDL

        return toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)   // cần tx để load LAZY user khi map
    public PageResponse<ReviewDto> getReviews(Integer movieId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> result = reviewRepository.findByTmdb_IdOrderByCreatedAtDesc(movieId, pageable);

        List<ReviewDto> content = result.getContent().stream().map(this::toDto).toList();

        return PageResponse.<ReviewDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RatingSummaryDto getRatingSummary(Integer movieId) {
        return reviewRepository.getRatingSummary(movieId);
    }

    @Override
    @Transactional
    public ReviewDto updateReview(Integer reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy review id=" + reviewId));
        checkOwner(review);

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return toDto(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Integer reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy review id=" + reviewId));
        checkOwner(review);
        reviewRepository.delete(review);
    }

    // ---- helpers ----

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user: " + email));
    }

    private void checkOwner(Review review) {
        User current = getCurrentUser();
        if (!review.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("Bạn không có quyền sửa/xóa đánh giá này");
        }
    }

    private ReviewDto toDto(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.setId(r.getId());
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUserId(r.getUser().getId());
        dto.setUserName(r.getUser().getFullName());   // đổi nếu field User tên khác
        return dto;
    }
}