package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDto {
    private Boolean isPremium;
    private Instant premiumExpiresAt;
    private Long daysRemaining;
    private Boolean autoRenew; // For future implementation
}
