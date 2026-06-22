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

    @NotNull(message = "Rating is required")
    @DecimalMin(value = "1.0", message = "Minimum rating is 1.0")
    @DecimalMax(value = "10.0", message = "Maximum rating is 10.0")
    private BigDecimal rating;

    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}