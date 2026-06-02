package be.backend.configuration;

import be.backend.entity.User;
import be.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    @ConditionalOnProperty(name = "app.admin.seed-enabled", havingValue = "true")
    CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email}") String adminEmail,
            @Value("${app.admin.password}") String adminPassword) {
        return args -> {
            if (userRepository.existsByEmail(adminEmail)) {
                log.info("Admin đã tồn tại, bỏ qua seeding.");
                return;
            }
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFullName("Administrator");
            admin.setRole("ADMIN");
            admin.setIsPremium(false);
            admin.setCreatedAt(Instant.now());
            userRepository.save(admin);
            log.info("Đã khởi tạo admin: {}", adminEmail);
        };
    }
}