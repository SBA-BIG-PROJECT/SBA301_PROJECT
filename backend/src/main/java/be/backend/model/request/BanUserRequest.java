package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BanUserRequest {

    @NotBlank(message = "Ban reason is required")
    @Size(min = 2, max = 500, message = "Ban reason must be between 2 and 500 characters")
    private String banReason;
}
