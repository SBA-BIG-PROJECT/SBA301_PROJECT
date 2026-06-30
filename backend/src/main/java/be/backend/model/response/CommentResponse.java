package be.backend.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommentResponse {

    private Integer id;
    private Integer authorId;
    private String authorName;
    private String content;
    private Integer parentCommentId;
    private Integer likeCount;
    private boolean liked;
    private boolean edited;
    private boolean deleted;
    private long replyCount;
    private Instant createdAt;
    private Instant updatedAt;
}