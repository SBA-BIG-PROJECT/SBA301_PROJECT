package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Dashboard statistics for admin panel
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    // User statistics
    private Long totalUsers;
    private Long activeUsers;
    private Long premiumUsers;
    private Long newUsersToday;
    private Long newUsersThisMonth;
    private Long bannedUsers;
    
    // Content statistics
    private Long totalMovies;
    private Long activeMovies;
    private Long totalReviews;
    private Long totalGenres;
    
    // Activity statistics
    private Long totalViews;
    private Long totalWatchlistItems;
    private Long viewsToday;
    private Long viewsThisMonth;
    
    // Revenue statistics
    private Long totalPayments;
    private Long successfulPayments;
    private Long pendingPayments;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueThisYear;
    private BigDecimal totalRevenue;
}
