package be.backend.controller;

import be.backend.model.dto.AdminDashboardStatsDto;
import be.backend.model.dto.MovieAnalyticsDto;
import be.backend.model.dto.RevenueAnalyticsDto;
import be.backend.services.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Admin Analytics Controller
 * Provides analytics and statistics endpoints for administrators
 * 
 * Authorization: Requires ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    /**
     * Get overall dashboard statistics
     * GET /api/v1/admin/analytics/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminAnalyticsService.getDashboardStats());
    }

    /**
     * Get movie analytics
     * GET /api/v1/admin/analytics/movies?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/movies")
    public ResponseEntity<MovieAnalyticsDto> getMovieAnalytics(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        return ResponseEntity.ok(adminAnalyticsService.getMovieAnalytics(startDate, endDate));
    }

    /**
     * Get revenue analytics
     * GET /api/v1/admin/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/revenue")
    public ResponseEntity<RevenueAnalyticsDto> getRevenueAnalytics(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        return ResponseEntity.ok(adminAnalyticsService.getRevenueAnalytics(startDate, endDate));
    }
}
