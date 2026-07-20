package be.backend.model.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCommentRequest {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    @Size(max = 5000, message = "Bình luận tối đa 5000 ký tự")
    private String content;

    /** Null = bình luận gốc. Có giá trị = trả lời bình luận gốc đó. */
    private Integer parentCommentId;
}