package be.backend.scheduler;

import be.backend.repository.UserRepository;
import be.backend.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecommendationScheduler {

    private final UserRepository userRepository;
    private final RecommendationService recommendationService;

    @Scheduled(cron = "0 0 2 * * *")
    public void generateDailyRecommendations() {

        userRepository.findAll()
                .forEach(user ->
                        recommendationService.generateRecommendations(
                                user.getId()
                        ));
    }
}