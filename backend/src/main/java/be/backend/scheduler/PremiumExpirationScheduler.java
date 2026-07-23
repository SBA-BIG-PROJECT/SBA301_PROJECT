package be.backend.scheduler;

import be.backend.entity.Payment;
import be.backend.entity.User;
import be.backend.enums.PaymentStatus;
import be.backend.repository.PaymentRepository;
import be.backend.repository.UserRepository;
import be.backend.services.NotificationService;
import be.backend.services.impl.SepayServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PremiumExpirationScheduler {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    /** Every 5 minutes: mark stale PENDING payments as EXPIRED. */
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void expirePendingPayments() {
        Instant cutoff = Instant.now().minus(SepayServiceImpl.PENDING_TTL);
        List<Payment> stale = paymentRepository
                .findByStatusAndCreatedAtBefore(PaymentStatus.PENDING.name(), cutoff);

        if (stale.isEmpty()) return;

        stale.forEach(p -> p.setStatus(PaymentStatus.EXPIRED.name()));
        paymentRepository.saveAll(stale);
        log.info("Marked {} stale payment(s) as EXPIRED", stale.size());
    }

    /** 8:00 AM daily: remind users whose premium expires in 3 days. */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void notifyExpiringPremium() {
        Instant now = Instant.now();
        Instant from = now.plus(Duration.ofDays(3));
        Instant to = now.plus(Duration.ofDays(4));

        List<User> expiring = userRepository
                .findByIsPremiumTrueAndDeletedAtIsNullAndPremiumExpiresAtBetween(from, to);

        expiring.forEach(u -> notificationService.createPremiumExpiringNotification(u, 3));

        if (!expiring.isEmpty()) {
            log.info("Sent expiry reminder to {} user(s)", expiring.size());
        }
    }

    /** 8:05 AM daily: downgrade users whose premium has already expired. */
    @Scheduled(cron = "0 5 8 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void downgradeExpiredPremium() {
        List<User> expired = userRepository
                .findByIsPremiumTrueAndDeletedAtIsNullAndPremiumExpiresAtBefore(Instant.now());

        if (expired.isEmpty()) return;

        expired.forEach(u -> u.setIsPremium(false));
        userRepository.saveAll(expired);
        log.info("Downgraded {} expired premium user(s)", expired.size());
    }
}