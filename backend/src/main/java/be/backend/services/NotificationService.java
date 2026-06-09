package be.backend.services;

import be.backend.model.dto.NotificationDto;
import be.backend.model.response.PageResponse;

import java.util.List;

public interface NotificationService {
    Long countUnreadNotifications();
    PageResponse<NotificationDto> getNotifications(int page, int size);
    void markAsRead(Integer notificationId);
    void markAllAsRead();
    void deleteNotification(Integer notificationId);
}

