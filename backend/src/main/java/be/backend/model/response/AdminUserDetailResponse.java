package be.backend.model.response;

import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.AdminUserDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.dto.WatchlistDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Detailed user information with activity history for admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailResponse {
    private AdminUserDto user;
    private List<ReviewDto> recentReviews;
    private List<WatchlistDto> recentWatchlist;
    private List<ViewHistoryDto> recentViews;
    private List<AdminPaymentDto> paymentHistory;
}
