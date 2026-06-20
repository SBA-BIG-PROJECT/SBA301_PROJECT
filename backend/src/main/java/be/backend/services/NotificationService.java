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
}

