package be.backend.controller;

import be.backend.configuration.CustomUserDetails;
import be.backend.model.request.CreateCommentRequest;
import be.backend.model.request.UpdateCommentRequest;
import be.backend.model.response.CommentResponse;
import be.backend.model.response.LikeResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;


    @PostMapping("/movies/{tmdbId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
            @PathVariable Integer tmdbId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {

        return commentService.create(tmdbId, user.getUserId(), request);
    }

    /** Danh sách bình luận gốc của 1 phim (mới nhất trước). */
    @GetMapping("/movies/{tmdbId}")
    public PageResponse<CommentResponse> getRootComments(
            @PathVariable Integer tmdbId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails user) {

        return commentService.getRootComments(tmdbId, userId(user), pageable);
    }


    @GetMapping("/{commentId}/replies")
    public PageResponse<CommentResponse> getReplies(
            @PathVariable Integer commentId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails user) {

        return commentService.getReplies(commentId, userId(user), pageable);
    }


    @PutMapping("/{commentId}")
    public CommentResponse updateComment(
            @PathVariable Integer commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {

        return commentService.update(commentId, user.getUserId(), request);
    }


    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal CustomUserDetails user) {

        commentService.delete(commentId, user.getUserId());
    }


    @PostMapping("/{commentId}/like")
    public LikeResponse toggleLike(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal CustomUserDetails user) {

        return commentService.toggleLike(commentId, user.getUserId());
    }


    private static Integer userId(CustomUserDetails user) {
        return user != null ? user.getUserId() : null;
    }
}