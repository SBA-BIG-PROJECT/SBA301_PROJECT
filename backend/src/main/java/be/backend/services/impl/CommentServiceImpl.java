package be.backend.services.impl;

import be.backend.entity.Comment;
import be.backend.entity.CommentLike;
import be.backend.model.request.CreateCommentRequest;
import be.backend.model.request.UpdateCommentRequest;
import be.backend.model.response.CommentResponse;
import be.backend.model.response.LikeResponse;
import be.backend.model.response.PageResponse;
import be.backend.repository.CommentLikeRepository;
import be.backend.repository.CommentRepository;
import be.backend.repository.MovieRepository;
import be.backend.repository.UserRepository;
import be.backend.services.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import be.backend.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private static final String DELETED_PLACEHOLDER = "[Comment deleted]";

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    @Override
    @Transactional
    public CommentResponse create(Integer tmdbId, Integer userId, CreateCommentRequest request) {
        Integer parentId = request.getParentCommentId();

        Comment comment = new Comment();
        comment.setUser(userRepository.getReferenceById(userId));

        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> notFound("Parent comment not found: id=" + parentId));

            if (Boolean.TRUE.equals(parent.getIsDeleted())) {
                throw badRequest("Cannot reply to a deleted comment");
            }
            if (parent.getParentComment() != null) {
                throw badRequest("Only one level of replies is allowed");
            }
            comment.setParentComment(parent);
            comment.setTmdb(parent.getTmdb()); // reply belongs to the same movie as its parent
        } else {
            comment.setTmdb(movieRepository.getReferenceById(tmdbId));
        }

        Instant now = Instant.now();
        comment.setContent(request.getContent().trim());
        comment.setLikeCount(0);
        comment.setIsEdited(false);
        comment.setIsDeleted(false);
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);

        Comment saved = commentRepository.save(comment);
        Comment withUser = commentRepository.findByIdWithUser(saved.getId()).orElse(saved);
        return toResponse(withUser, false, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getRootComments(Integer tmdbId, Integer currentUserId, Pageable pageable) {
        Page<Comment> page = commentRepository.findRootComments(movieRepository.getReferenceById(tmdbId), pageable);
        return PageResponse.from(page, toResponses(page.getContent(), currentUserId, true));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getReplies(Integer parentCommentId, Integer currentUserId, Pageable pageable) {
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> notFound("Comment not found: id=" + parentCommentId));
        Page<Comment> page = commentRepository.findReplies(parent, pageable);
        return PageResponse.from(page, toResponses(page.getContent(), currentUserId, false));
    }

    @Override
    @Transactional
    public CommentResponse update(Integer commentId, Integer userId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findByIdWithUser(commentId)
                .orElseThrow(() -> notFound("Comment not found: id=" + commentId));

        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw badRequest("Cannot edit a deleted comment");
        }
        if (!comment.getUser().getId().equals(userId)) {
            throw forbidden("You do not have permission to edit this comment");
        }

        comment.setContent(request.getContent().trim());
        comment.setIsEdited(true);
        comment.setUpdatedAt(Instant.now());

        boolean liked = commentLikeRepository.existsByComment_IdAndUser_Id(commentId, userId);
        long replyCount = comment.getParentComment() == null ? countReplies(commentId) : 0;
        return toResponse(comment, liked, replyCount);
    }

    @Override
    @Transactional
    public void delete(Integer commentId, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> notFound("Comment not found: id=" + commentId));

        if (!comment.getUser().getId().equals(userId)) {
            throw forbidden("You do not have permission to delete this comment");
        }
        if (!Boolean.TRUE.equals(comment.getIsDeleted())) {
            comment.setIsDeleted(true);          // soft delete -> keep the reply thread
            comment.setUpdatedAt(Instant.now());
        }
    }

    @Override
    @Transactional
    public LikeResponse toggleLike(Integer commentId, Integer userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> notFound("Comment not found: id=" + commentId));

        if (Boolean.TRUE.equals(comment.getIsDeleted())) {
            throw badRequest("Cannot like a deleted comment");
        }

        boolean liked;
        if (commentLikeRepository.existsByComment_IdAndUser_Id(commentId, userId)) {
            commentLikeRepository.deleteByComment_IdAndUser_Id(commentId, userId);
            comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
            liked = false;
        } else {
            CommentLike like = new CommentLike();
            like.setComment(comment);
            like.setUser(userRepository.getReferenceById(userId));
            like.setCreatedAt(Instant.now());
            commentLikeRepository.save(like);
            comment.setLikeCount(comment.getLikeCount() + 1);
            liked = true;
        }
        return LikeResponse.builder()
                .commentId(commentId)
                .liked(liked)
                .likeCount(comment.getLikeCount())
                .build();
    }

    // ---------- entity -> response mapping (service layer only) ----------

    private List<CommentResponse> toResponses(List<Comment> comments, Integer currentUserId, boolean withReplyCount) {
        if (comments.isEmpty()) {
            return Collections.emptyList();
        }
        List<Integer> ids = comments.stream().map(Comment::getId).toList();

        Map<Integer, Long> replyCounts = withReplyCount
                ? commentRepository.countRepliesByParentIds(ids).stream()
                .collect(Collectors.toMap(
                        CommentRepository.ReplyCount::getParentId,
                        CommentRepository.ReplyCount::getTotal))
                : Collections.emptyMap();

        Set<Integer> likedIds = (currentUserId == null)
                ? Collections.emptySet()
                : commentLikeRepository.findByUser_IdAndComment_IdIn(currentUserId, ids).stream()
                .map(cl -> cl.getComment().getId())
                .collect(Collectors.toSet());

        return comments.stream()
                .map(c -> toResponse(c, likedIds.contains(c.getId()),
                        replyCounts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    private CommentResponse toResponse(Comment c, boolean liked, long replyCount) {
        boolean deleted = Boolean.TRUE.equals(c.getIsDeleted());
        return CommentResponse.builder()
                .id(c.getId())
                .authorId(c.getUser().getId())
                .authorName(c.getUser().getFullName())
                .content(deleted ? DELETED_PLACEHOLDER : c.getContent())
                .parentCommentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                .likeCount(c.getLikeCount())
                .liked(liked)
                .edited(Boolean.TRUE.equals(c.getIsEdited()))
                .deleted(deleted)
                .replyCount(replyCount)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private long countReplies(Integer parentId) {
        return commentRepository.countRepliesByParentIds(List.of(parentId)).stream()
                .findFirst()
                .map(CommentRepository.ReplyCount::getTotal)
                .orElse(0L);
    }


    private ResourceNotFoundException notFound(String msg) {
        return new ResourceNotFoundException(msg);
    }

    private IllegalArgumentException badRequest(String msg) {
        return new IllegalArgumentException(msg);
    }

    private AccessDeniedException forbidden(String msg) {
        return new AccessDeniedException(msg);
    }
}