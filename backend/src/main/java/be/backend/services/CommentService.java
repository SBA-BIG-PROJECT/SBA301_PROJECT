package be.backend.services;

import be.backend.model.request.CreateCommentRequest;
import be.backend.model.request.UpdateCommentRequest;
import be.backend.model.response.CommentResponse;
import be.backend.model.response.LikeResponse;
import be.backend.model.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CommentService {

    CommentResponse create(Integer tmdbId, Integer userId, CreateCommentRequest request);

    PageResponse<CommentResponse> getRootComments(Integer tmdbId, Integer currentUserId, Pageable pageable);

    PageResponse<CommentResponse> getReplies(Integer parentCommentId, Integer currentUserId, Pageable pageable);

    CommentResponse update(Integer commentId, Integer userId, UpdateCommentRequest request);

    void delete(Integer commentId, Integer userId);

    LikeResponse toggleLike(Integer commentId, Integer userId);
}