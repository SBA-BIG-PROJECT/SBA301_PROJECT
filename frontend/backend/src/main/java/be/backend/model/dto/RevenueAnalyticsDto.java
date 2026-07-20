package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Revenue analytics data for admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalyticsDto {
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private Long totalOrders;
    private Long successfulOrders;
    private Double conversionRate;
    
    // Time-based breakdown
    private List<DailyRevenueDto> dailyRevenue;
    private List<MonthlyRevenueDto> monthlyRevenue;
    
    // Plan breakdown
    private BigDecimal monthlyPlanRevenue;
    private BigDecimal yearlyPlanRevenue;
    private Long monthlyPlanCount;
    private Long yearlyPlanCount;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenueDto {
        private LocalDate date;
        private BigDecimal revenue;
        private Long orderCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDto {
        private Integer year;
        private Integer month;
        private BigDecimal revenue;
        private Long orderCount;
    }
}
