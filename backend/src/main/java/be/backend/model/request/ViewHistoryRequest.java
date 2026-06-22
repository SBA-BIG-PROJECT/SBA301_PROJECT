package be.backend.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ViewHistoryRequest {
    @NotNull(message = "Movie ID is required")
    private Integer movieId;

    @Min(value = 0, message = "Watch duration must be >= 0")
    private Integer watchDuration; // in seconds
}
