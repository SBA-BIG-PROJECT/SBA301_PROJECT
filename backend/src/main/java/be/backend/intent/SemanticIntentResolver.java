package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

@Component
public class SemanticIntentResolver implements IntentResolver {

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria) {

        if (message == null || message.isBlank()) {
            return;
        }

        String text = message.toLowerCase();

        if (containsAny(
                text,
                "ít người biết",
                "hidden gem",
                "underrated")) {

            criteria.setHiddenGem(true);
            criteria.setMinRating(7.5);
            criteria.setSortBy("rating");
            criteria.setDescending(true);

            /*
             * Không nên đặt minVoteCount quá cao cho hidden gem.
             * Nếu đặt 1000 thì sẽ loại nhiều phim ít nổi tiếng.
             */
            if (criteria.getMinVoteCount() == null) {
                criteria.setMinVoteCount(20);
            }
        }

        if (containsAny(
                text,
                "đánh giá cao",
                "điểm cao",
                "top rated",
                "highest rated")) {

            criteria.setSortBy("rating");
            criteria.setDescending(true);
        }

        if (containsAny(
                text,
                "phim mới",
                "mới nhất",
                "newest",
                "latest")) {

            criteria.setSortBy("release");
            criteria.setDescending(true);
        }

        if (containsAny(
                text,
                "oscar",
                "đoạt giải",
                "award winning")) {

            criteria.setAwardWinning(true);
        }

        if (containsAny(
                text,
                "plot twist",
                "hack não",
                "mind-blowing",
                "mind bending")) {

            criteria.setMindBlowing(true);
        }

        if (containsAny(
                text,
                "happy ending",
                "kết thúc có hậu")) {

            criteria.setHappyEnding(true);
        }

        if (containsAny(
                text,
                "phản diện thắng",
                "villain wins")) {

            criteria.setVillainWins(true);
        }
    }

    private boolean containsAny(
            String text,
            String... keywords) {

        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }
}