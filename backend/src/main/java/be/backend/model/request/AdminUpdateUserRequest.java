package be.backend.model.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to update user by admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {
    
    @Size(min = 2, max = 255, message = "Full name must be between 2 and 255 characters")
    private String fullName;
    
    private String adminNotes;
}
