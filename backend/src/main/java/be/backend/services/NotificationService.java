package be.backend.services;

import be.backend.entity.Recommendation;
import be.backend.entity.User;
import be.backend.model.dto.NotificationDto;
import be.backend.model.response.PageResponse;

import java.util.List;

public interface NotificationService {
    //--- by users ---
    Long countUnreadNotifications();
    PageResponse<NotificationDto> getNotifications(int page, int size);
    void markAsRead(Integer notificationId);
    void markAllAsRead();
    void deleteNotification(Integer notificationId);

    //--- by system ---
    void createRecommendationNotification(User user, Recommendation recommendation);
}

