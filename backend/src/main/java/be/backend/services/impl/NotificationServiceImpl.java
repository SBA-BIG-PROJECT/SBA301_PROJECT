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
        if (user == null) {
            return 0L;
        }
        return notificationRepository.countByUser_IdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getNotifications(int page, int size) {
        User user = getCurrentUser();
        if (user == null) return PageResponse.<NotificationDto>builder().content(List.of()).page(0).size(0).totalElements(0).totalPages(0).last(true).build();

        Pageable pageable = PageRequest.of(page, size);
        var pageResult = notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), pageable);
        List<NotificationDto> content = pageResult.getContent().stream().map(this::toDto).collect(Collectors.toList());
        return PageResponse.from(new PageImpl<>(content, pageable, pageResult.getTotalElements()));
    }



    @Override
    @Transactional
    public void markAsRead(Integer notificationId) {
        User user = getCurrentUser();
        if (user == null) {
            return;
        }
        Notification n = notificationRepository
                .findByIdAndUser_Id(notificationId, user.getId())
                .orElse(null);
        if (n == null) {
            return;
        }
        n.setIsRead(true);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return;
        var list = notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        list.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(list);
    }

    @Override
    @Transactional
    public void deleteNotification(Integer notificationId) {

        User user = getCurrentUser();

        if (user == null) {
            return;
        }

        Notification notification = notificationRepository
                .findByIdAndUser_Id(notificationId, user.getId())
                .orElse(null);

        if (notification == null) {
            return;
        }

        notificationRepository.delete(notification);
    }

    // ---- helpers ----

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();

        dto.setId(n.getId());
        dto.setMessage(n.getMessage());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());

        return dto;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user: " + email));
    }
}

