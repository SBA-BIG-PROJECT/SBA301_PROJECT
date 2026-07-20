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

    @Scheduled(cron = "0 0 8 * * *") // 8am hàng ngày
//    @Scheduled(cron = "0 * * * * *")
//    @Scheduled(cron = "*/10 * * * * *")
//@Scheduled(fixedRate = 10000)
public void checkPremiumExpiration() {

    List<User> users = userRepository.findAll();

    Instant now = Instant.now();

    System.out.println("Scheduler running...");

    for (User user : users) {

        System.out.println("User: " + user.getEmail());

        if (!Boolean.TRUE.equals(user.getIsPremium())
                || user.getPremiumExpiresAt() == null) {
            System.out.println("Skip because not premium");
            continue;
        }

        long remainingDays = Duration.between(
                now,
                user.getPremiumExpiresAt()
        ).toDays();

        System.out.println("Remaining days: " + remainingDays);

        if (remainingDays == 3) {
            System.out.println("Create notification");

            notificationService.createPremiumExpiringNotification(user, 3);
        }
    }
}
}