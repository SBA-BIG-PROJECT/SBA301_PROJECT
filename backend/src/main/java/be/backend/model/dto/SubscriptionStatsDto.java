package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionStatsDto {
    private Long totalSubscribers;
    private Long activeSubscribers;
    private Long expiredSubscribers;
    private Long expiringThisWeek;
    private Long expiringThisMonth;
}
