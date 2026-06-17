package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Admin view of user data with additional fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private Integer id;
    private String email;
    private String fullName;
    private Integer age;
    private String avatarUrl;
    private String role;
    private Boolean isPremium;
    private Instant premiumExpiresAt;
    private Instant createdAt;
    private Instant lastLoginAt;
    private Boolean isActive;
    private Instant deletedAt;
    private Instant bannedAt;
    private String bannedReason;
    private String adminNotes;
    
    // Aggregated stats
    private Long totalReviews;
    private Long totalWatchlist;
    private Long totalViews;
    private Long totalPayments;
}
