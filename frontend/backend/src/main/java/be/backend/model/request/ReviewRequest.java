package be.backend.model.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "Điểm không được để trống")
    @DecimalMin(value = "1.0", message = "Điểm tối thiểu là 1.0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10.0")
    private BigDecimal rating;

    @Size(max = 1000, message = "Bình luận tối đa 1000 ký tự")
    private String comment;
}