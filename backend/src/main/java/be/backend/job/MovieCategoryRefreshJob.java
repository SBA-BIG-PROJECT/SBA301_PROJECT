package be.backend.job;

import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MovieCategoryRefreshJob {

    private final MovieService movieService;

    // Run every day at 00:00 (midnight)
    @Scheduled(cron = "0 0 0 * * ?")
    public void refreshCategoriesDaily() {
        log.info("Starting daily movie categories refresh job...");
        try {
            movieService.refreshAllMovieCategories();
            log.info("Successfully completed daily movie categories refresh job.");
        } catch (Exception e) {
            log.error("Error during daily movie categories refresh job", e);
        }
    }
}
