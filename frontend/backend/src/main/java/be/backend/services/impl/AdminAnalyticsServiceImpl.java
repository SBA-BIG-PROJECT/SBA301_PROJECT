package be.backend.services.impl;

import be.backend.model.dto.AdminDashboardStatsDto;
import be.backend.model.dto.MovieAnalyticsDto;
import be.backend.model.dto.RevenueAnalyticsDto;
import be.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import be.backend.services.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

/**
 * Admin Analytics Service Implementation
 * Provides comprehensive analytics for administrators
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ReviewRepository reviewRepository;
    private final ViewLogRepository viewLogRepository;
    private final WatchlistRepository watchlistRepository;
    private final PaymentRepository paymentRepository;
    private final GenreRepository genreRepository;

    @Override
    public AdminDashboardStatsDto getDashboardStats() {
        Instant now = Instant.now();
        Instant startOfToday = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant startOfYear = LocalDate.now().withDayOfYear(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        
        AdminDashboardStatsDto stats = new AdminDashboardStatsDto();
        
        // User statistics
        stats.setTotalUsers(userRepository.countByDeletedAtIsNull());
        stats.setActiveUsers(userRepository.countByDeletedAtIsNull()); // Can refine with last login
        stats.setPremiumUsers(userRepository.countByDeletedAtIsNullAndIsPremiumTrue());
        stats.setNewUsersToday(userRepository.countByDeletedAtIsNullAndCreatedAtAfter(startOfToday));
        stats.setNewUsersThisMonth(userRepository.countByDeletedAtIsNullAndCreatedAtAfter(startOfMonth));
        stats.setBannedUsers(userRepository.countByBannedAtIsNotNull());
        
        // Content statistics
        stats.setTotalMovies((long) movieRepository.findAll().size());
        stats.setActiveMovies((long) movieRepository.findByIsActiveTrue(org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements());
        stats.setTotalReviews((long) reviewRepository.findAll().size());
        stats.setTotalGenres((long) genreRepository.findAll().size());
        
        // Activity statistics  
        stats.setTotalViews((long) viewLogRepository.findAll().size());
        stats.setTotalWatchlistItems((long) watchlistRepository.findAll().size());
        // Views today/month would need additional repository methods
        stats.setViewsToday(0L);
        stats.setViewsThisMonth(0L);
        
        // Revenue statistics
        stats.setTotalPayments((long) paymentRepository.findAll().size());
        stats.setSuccessfulPayments(paymentRepository.countByStatus("SUCCESS"));
        stats.setPendingPayments(paymentRepository.countByStatus("PENDING"));
        
        stats.setRevenueToday(paymentRepository.sumAmountByStatusAndPaidAtAfter(startOfToday));
        stats.setRevenueThisMonth(paymentRepository.sumAmountByStatusAndPaidAtAfter(startOfMonth));
        stats.setRevenueThisYear(paymentRepository.sumAmountByStatusAndPaidAtAfter(startOfYear));
        stats.setTotalRevenue(paymentRepository.sumTotalRevenue());
        
        log.info("Generated dashboard statistics");
        return stats;
    }

    @Override
    public MovieAnalyticsDto getMovieAnalytics(LocalDate startDate, LocalDate endDate) {
        MovieAnalyticsDto analytics = new MovieAnalyticsDto();
        
        // Convert LocalDate to Instant for database queries
        Instant startInstant = startDate.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        Instant endInstant = endDate.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        
        try {
            // Most viewed movies
            List<Object[]> mostViewed = viewLogRepository.findMostViewedMovies(startInstant, endInstant, PageRequest.of(0, 10));
            analytics.setMostViewedMovies(mostViewed.stream()
                .map(row -> new MovieAnalyticsDto.TopMovieDto(
                    (Integer) row[0],  // tmdbId
                    (String) row[1],   // title
                    (String) row[2],   // posterPath
                    ((Number) row[3]).longValue(),  // viewCount
                    null               // rating not needed for views
                ))
                .collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            log.warn("Failed to fetch most viewed movies: {}", e.getMessage());
            analytics.setMostViewedMovies(Collections.emptyList());
        }
        
        try {
            // Highest rated movies - get top 10 movies by average rating with at least 5 reviews
            List<Object[]> highestRated = movieRepository.findAll().stream()
                .filter(m -> !m.getReviews().isEmpty() && m.getReviews().size() >= 5)
                .map(m -> new Object[]{
                    m.getId(),
                    m.getTitle(),
                    m.getPosterPath(),
                    (long) m.getReviews().size(),
                    m.getReviews().stream()
                        .mapToDouble(r -> r.getRating().doubleValue())
                        .average()
                        .orElse(0.0)
                })
                .sorted((a, b) -> Double.compare(((Number) b[4]).doubleValue(), ((Number) a[4]).doubleValue()))
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
                
            analytics.setHighestRatedMovies(highestRated.stream()
                .map(row -> new MovieAnalyticsDto.TopMovieDto(
                    (Integer) row[0],
                    (String) row[1],
                    (String) row[2],
                    ((Number) row[3]).longValue(),
                    ((Number) row[4]).doubleValue()
                ))
                .collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            log.warn("Failed to fetch highest rated movies: {}", e.getMessage());
            analytics.setHighestRatedMovies(Collections.emptyList());
        }
        
        try {
            // Most watchlisted movies
            List<Object[]> mostWatchlisted = movieRepository.findAll().stream()
                .filter(m -> !m.getWatchlists().isEmpty())
                .map(m -> new Object[]{
                    m.getId(),
                    m.getTitle(),
                    m.getPosterPath(),
                    (long) m.getWatchlists().size()
                })
                .sorted((a, b) -> Long.compare(((Number) b[3]).longValue(), ((Number) a[3]).longValue()))
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
                
            analytics.setMostWatchlistedMovies(mostWatchlisted.stream()
                .map(row -> new MovieAnalyticsDto.TopMovieDto(
                    (Integer) row[0],
                    (String) row[1],
                    (String) row[2],
                    ((Number) row[3]).longValue(),
                    null
                ))
                .collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            log.warn("Failed to fetch most watchlisted movies: {}", e.getMessage());
            analytics.setMostWatchlistedMovies(Collections.emptyList());
        }
        
        try {
            // Popular genres
            List<Object[]> popularGenres = genreRepository.findAll().stream()
                .map(g -> new Object[]{
                    g.getId(),
                    g.getName(),
                    (long) g.getMovieGenres().size()
                })
                .filter(row -> ((Number) row[2]).longValue() > 0)
                .sorted((a, b) -> Long.compare(((Number) b[2]).longValue(), ((Number) a[2]).longValue()))
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
                
            analytics.setPopularGenres(popularGenres.stream()
                .map(row -> new MovieAnalyticsDto.GenrePopularityDto(
                    (Integer) row[0],
                    (String) row[1],
                    ((Number) row[2]).longValue(),
                    0L,  // viewCount - would need additional query
                    0.0  // averageRating - would need additional query
                ))
                .collect(java.util.stream.Collectors.toList()));
        } catch (Exception e) {
            log.warn("Failed to fetch popular genres: {}", e.getMessage());
            analytics.setPopularGenres(Collections.emptyList());
        }
        
        log.info("Generated movie analytics from {} to {}", startDate, endDate);
        return analytics;
    }

    @Override
    public RevenueAnalyticsDto getRevenueAnalytics(LocalDate startDate, LocalDate endDate) {
        RevenueAnalyticsDto analytics = new RevenueAnalyticsDto();
        
        // Total revenue
        BigDecimal totalRevenue = paymentRepository.sumTotalRevenue();
        analytics.setTotalRevenue(totalRevenue);
        
        // Total orders
        long totalOrders = paymentRepository.countByStatus("SUCCESS");
        analytics.setTotalOrders(totalOrders);
        analytics.setSuccessfulOrders(totalOrders);
        
        // Average order value
        if (totalOrders > 0) {
            BigDecimal avgValue = totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, BigDecimal.ROUND_HALF_UP);
            analytics.setAverageOrderValue(avgValue);
        } else {
            analytics.setAverageOrderValue(BigDecimal.ZERO);
        }
        
        // Plan breakdown
        List<Object[]> planBreakdown = paymentRepository.countAndSumByPlanType();
        for (Object[] row : planBreakdown) {
            String planType = (String) row[0];
            Long count = (Long) row[1];
            BigDecimal sum = (BigDecimal) row[2];
            
            if ("MONTHLY".equals(planType)) {
                analytics.setMonthlyPlanCount(count);
                analytics.setMonthlyPlanRevenue(sum);
            } else if ("YEARLY".equals(planType)) {
                analytics.setYearlyPlanCount(count);
                analytics.setYearlyPlanRevenue(sum);
            }
        }
        
        // Daily and monthly revenue - would need more complex queries
        analytics.setDailyRevenue(Collections.emptyList());
        analytics.setMonthlyRevenue(Collections.emptyList());
        
        // Conversion rate - placeholder
        analytics.setConversionRate(0.0);
        
        log.info("Generated revenue analytics from {} to {}", startDate, endDate);
        return analytics;
    }
}
