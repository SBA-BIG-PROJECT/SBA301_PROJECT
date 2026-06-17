package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeleteAccountRequest {
    
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
    
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason; // Optional - for analytics
}
