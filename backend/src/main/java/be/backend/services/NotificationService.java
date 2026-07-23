package be.backend.services;


import be.backend.entity.User;
import be.backend.model.dto.NotificationDto;
import be.backend.model.response.PageResponse;



public interface NotificationService {
    //--- by users ---
    Long countUnreadNotifications();
    PageResponse<NotificationDto> getNotifications(int page, int size);
    void markAsRead(Integer notificationId);
    void markAllAsRead();
    void deleteNotification(Integer notificationId);

    //--- by system ---
    void createRecommendationSummaryNotification(User user, int totalRecommendations);

    void createNewMovieNotification(User user, String movieTitle);

    void createPremiumPaymentSuccessNotification(User user);

    void createPremiumExpiringNotification(User user, int remainingDays);

    void createAccountBannedNotification(User user, String reason);
    
    void createAddedToWatchlistNotification(User user, String movieTitle);
    
    void createWelcomeNotification(User user);
}

