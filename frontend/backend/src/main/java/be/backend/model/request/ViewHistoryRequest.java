package be.backend.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ViewHistoryRequest {
    @NotNull(message = "Movie ID không được để trống")
    private Integer movieId;

    @Min(value = 0, message = "Thời lượng xem phải >= 0")
    private Integer watchDuration; // in seconds
}
