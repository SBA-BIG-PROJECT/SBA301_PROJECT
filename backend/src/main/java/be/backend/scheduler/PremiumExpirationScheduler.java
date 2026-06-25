package be.backend.scheduler;

import be.backend.entity.User;
import be.backend.repository.UserRepository;
import be.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PremiumExpirationScheduler {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *")
    public void checkPremiumExpiration() {

        List<User> users = userRepository.findAll();

        Instant now = Instant.now();

        for (User user : users) {

            if (!Boolean.TRUE.equals(user.getIsPremium())
                    || user.getPremiumExpiresAt() == null) {
                continue;
            }

            long remainingDays =
                    Duration.between(
                            now,
                            user.getPremiumExpiresAt()
                    ).toDays();

            if (remainingDays == 3) {

                notificationService
                        .createPremiumExpiringNotification(
                                user,
                                3
                        );
            }
        }
    }
}