package be.backend.services.impl;

import be.backend.entity.Notification;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.NotificationDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.NotificationRepository;
import be.backend.repository.UserRepository;
import be.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Long countUnreadNotifications() {

        User user = getCurrentUser();

        return notificationRepository
                .countByUser_IdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getNotifications(
            int page,
            int size) {

        User user = getCurrentUser();

        Pageable pageable =
                PageRequest.of(page, size);

        var pageResult =
                notificationRepository
                        .findByUser_IdOrderByCreatedAtDesc(
                                user.getId(),
                                pageable
                        );

        List<NotificationDto> content =
                pageResult.getContent()
                        .stream()
                        .map(this::toDto)
                        .collect(Collectors.toList());

        return PageResponse.from(
                new PageImpl<>(
                        content,
                        pageable,
                        pageResult.getTotalElements()
                )
        );
    }

    @Override
    @Transactional
    public void markAsRead(Integer notificationId) {

        User user = getCurrentUser();

        Notification notification =
                notificationRepository
                        .findByIdAndUser_Id(
                                notificationId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Notification not found: "
                                                + notificationId
                                )
                        );

        notification.setIsRead(true);
    }

    @Override
    @Transactional
    public void markAllAsRead() {

        User user = getCurrentUser();

        List<Notification> notifications =
                notificationRepository
                        .findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
                                user.getId()
                        );

        notifications.forEach(
                notification ->
                        notification.setIsRead(true)
        );
    }

    @Override
    @Transactional
    public void deleteNotification(Integer notificationId) {

        User user = getCurrentUser();

        Notification notification =
                notificationRepository
                        .findByIdAndUser_Id(
                                notificationId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Notification not found: "
                                                + notificationId
                                )
                        );

        notificationRepository.delete(notification);
    }

    /**
     * Recommendation generated
     */
    @Override
    @Transactional
    public void createRecommendationSummaryNotification(
            User user,
            int totalRecommendations) {

        if (totalRecommendations == 0) {
            return;
        }

        createNotification(
                user,
                "You have "
                        + totalRecommendations
                        + " new movie recommendations."
        );
    }

    /**
     * New movie added
     */
    @Override
    @Transactional
    public void createNewMovieNotification(
            User user,
            String movieTitle) {

        createNotification(
                user,
                "A new movie \""
                        + movieTitle
                        + "\" has been added."
        );
    }

    /**
     * Premium payment success
     */
    @Override
    @Transactional
    public void createPremiumPaymentSuccessNotification(
            User user) {

        createNotification(
                user,
                "Premium subscription activated successfully."
        );
    }

    /**
     * Premium expiring soon
     */
    @Override
    @Transactional
    public void createPremiumExpiringNotification(
            User user,
            int remainingDays) {

        createNotification(
                user,
                "Your Premium subscription will expire in "
                        + remainingDays
                        + " day(s)."
        );
    }

    /**
     * Account banned
     */
    @Override
    @Transactional
    public void createAccountBannedNotification(
            User user,
            String reason) {

        createNotification(
                user,
                "Your account has been restricted. Reason: "
                        + reason
        );
    }

// ---------- Helpers ----------

    private void createNotification(
            User user,
            String message) {

        Notification notification =
                new Notification();

        notification.setUser(user);
        notification.setMessage(message);

        notificationRepository.save(notification);
    }

    private NotificationDto toDto(
            Notification notification) {

        NotificationDto dto =
                new NotificationDto();

        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());

        return dto;
    }

    private User getCurrentUser() {

        var authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null) {
            throw new ResourceNotFoundException(
                    "User chưa đăng nhập"
            );
        }

        String email =
                authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found: "
                                        + email
                        )
                );
    }

}
