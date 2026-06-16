package be.backend.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to grant premium access to user
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminGrantPremiumRequest {
    
    @NotNull(message = "Plan type is required")
    private String planType; // "MONTHLY" or "YEARLY"
    
    private String reason; // Optional reason for granting premium
}
