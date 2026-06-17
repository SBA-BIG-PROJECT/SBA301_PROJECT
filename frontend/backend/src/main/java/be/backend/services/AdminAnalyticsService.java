package be.backend.services;

import be.backend.model.dto.AdminDashboardStatsDto;
import be.backend.model.dto.MovieAnalyticsDto;
import be.backend.model.dto.RevenueAnalyticsDto;

import java.time.LocalDate;

/**
 * Admin Analytics Service
 * Provides analytics and statistics for administrators
 */
public interface AdminAnalyticsService {
    
    /**
     * Get overall dashboard statistics
     */
    AdminDashboardStatsDto getDashboardStats();
    
    /**
     * Get movie analytics (most viewed, rated, etc.)
     */
    MovieAnalyticsDto getMovieAnalytics(LocalDate startDate, LocalDate endDate);
    
    /**
     * Get revenue analytics
     */
    RevenueAnalyticsDto getRevenueAnalytics(LocalDate startDate, LocalDate endDate);
}
