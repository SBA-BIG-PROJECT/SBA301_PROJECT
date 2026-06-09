package be.backend.repository;

import be.backend.entity.Notification;
import be.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    Page<Notification> findByUser_IdOrderByCreatedAtDesc( Integer userId, Pageable pageable);

    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc( Integer userId );

    Long countByUser_IdAndIsReadFalse( Integer userId );

    Optional<Notification> findByIdAndUser_Id( Integer notificationId, Integer userId );
}

