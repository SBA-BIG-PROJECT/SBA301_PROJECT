package be.backend.model.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class LikeResponse {
    private Integer commentId;
    private boolean liked;
    private Integer likeCount;
}