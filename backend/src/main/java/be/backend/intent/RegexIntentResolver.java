package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RegexIntentResolver implements IntentResolver {

    private static final int MAX_RESULT_SIZE = 30;

    /*
     * Top 5
     * Top 10 phim hành động
     */
    private static final Pattern TOP_PATTERN =
            Pattern.compile(
                    "(?iu)top\\s*(\\d{1,3})"
            );

    /*
     * điểm trên 8
     * rating > 8
     * imdb từ 7.5
     * điểm ít nhất 8
     */
    private static final Pattern MIN_RATING_KEYWORD_FIRST =
            Pattern.compile(
                    "(?iu)(?:điểm|rating|imdb)" +
                            "\\s*(?:là\\s*)?" +
                            "(?:>=|>|trên|hơn|từ|ít\\s+nhất|at\\s+least)" +
                            "\\s*(\\d+(?:[.,]\\d+)?)"
            );

    /*
     * trên 8 điểm
     * > 8 rating
     * từ 7.5 imdb
     */
    private static final Pattern MIN_RATING_OPERATOR_FIRST =
            Pattern.compile(
                    "(?iu)(?:>=|>|trên|hơn|từ|ít\\s+nhất|at\\s+least)" +
                            "\\s*(\\d+(?:[.,]\\d+)?)" +
                            "\\s*(?:điểm|rating|imdb)"
            );

    /*
     * điểm dưới 8
     * rating <= 7.5
     * imdb tối đa 9
     */
    private static final Pattern MAX_RATING_KEYWORD_FIRST =
            Pattern.compile(
                    "(?iu)(?:điểm|rating|imdb)" +
                            "\\s*(?:là\\s*)?" +
                            "(?:<=|<|dưới|thấp\\s+hơn|tối\\s+đa|at\\s+most)" +
                            "\\s*(\\d+(?:[.,]\\d+)?)"
            );

    /*
     * dưới 8 điểm
     * <= 7.5 rating
     */
    private static final Pattern MAX_RATING_OPERATOR_FIRST =
            Pattern.compile(
                    "(?iu)(?:<=|<|dưới|thấp\\s+hơn|tối\\s+đa|at\\s+most)" +
                            "\\s*(\\d+(?:[.,]\\d+)?)" +
                            "\\s*(?:điểm|rating|imdb)"
            );

    /*
     * điểm 8
     * rating 7.5
     * imdb 9
     */
    private static final Pattern EXACT_RATING_PATTERN =
            Pattern.compile(
                    "(?iu)(?:điểm|rating|imdb)" +
                            "\\s*(?:là\\s*)?" +
                            "(\\d+(?:[.,]\\d+)?)"
            );

    /*
     * trên 1000 lượt đánh giá
     * 500 votes
     * ít nhất 200 lượt bình chọn
     */
    private static final Pattern MIN_VOTE_COUNT_PATTERN =
            Pattern.compile(
                    "(?iu)(?:>=|>|trên|hơn|từ|ít\\s+nhất|at\\s+least)?" +
                            "\\s*(\\d+)" +
                            "\\s*(?:vote|votes|lượt\\s+đánh\\s+giá|lượt\\s+bình\\s+chọn)"
            );

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria) {

        if (message == null
                || message.isBlank()
                || criteria == null) {

            return;
        }

        String text =
                message.toLowerCase(Locale.ROOT);

        mapTopResultCount(text, criteria);
        mapVoteCount(text, criteria);
        mapRating(text, criteria);
    }

    private void mapTopResultCount(
            String text,
            MovieSearchCriteria criteria) {

        Matcher matcher =
                TOP_PATTERN.matcher(text);

        if (!matcher.find()) {
            return;
        }

        int requestedSize =
                Integer.parseInt(
                        matcher.group(1)
                );

        int safeSize =
                Math.min(
                        Math.max(requestedSize, 1),
                        MAX_RESULT_SIZE
                );

        /*
         * MovieSearchService dùng criteria.size
         * để tạo PageRequest.
         */
        criteria.setSize(safeSize);
    }

    private void mapVoteCount(
            String text,
            MovieSearchCriteria criteria) {

        Matcher matcher =
                MIN_VOTE_COUNT_PATTERN.matcher(text);

        if (!matcher.find()) {
            return;
        }

        criteria.setMinVoteCount(
                Integer.parseInt(
                        matcher.group(1)
                )
        );
    }

    private void mapRating(
            String text,
            MovieSearchCriteria criteria) {

        boolean hasRatingKeyword =
                text.contains("điểm")
                        || text.contains("rating")
                        || text.contains("imdb");

        if (!hasRatingKeyword) {
            return;
        }

        Double minRating =
                findNumber(
                        MIN_RATING_KEYWORD_FIRST,
                        text
                );

        if (minRating == null) {
            minRating =
                    findNumber(
                            MIN_RATING_OPERATOR_FIRST,
                            text
                    );
        }

        if (minRating != null) {
            criteria.setMinRating(
                    normalizeRating(minRating)
            );
        }

        Double maxRating =
                findNumber(
                        MAX_RATING_KEYWORD_FIRST,
                        text
                );

        if (maxRating == null) {
            maxRating =
                    findNumber(
                            MAX_RATING_OPERATOR_FIRST,
                            text
                    );
        }

        if (maxRating != null) {
            criteria.setMaxRating(
                    normalizeRating(maxRating)
            );
        }

        /*
         * Chỉ dùng dạng chính xác khi chưa tìm thấy
         * minRating hoặc maxRating.
         */
        if (criteria.getMinRating() == null
                && criteria.getMaxRating() == null) {

            Double exactRating =
                    findNumber(
                            EXACT_RATING_PATTERN,
                            text
                    );

            if (exactRating != null) {
                criteria.setMinRating(
                        normalizeRating(exactRating)
                );
            }
        }
    }

    private Double findNumber(
            Pattern pattern,
            String text) {

        Matcher matcher =
                pattern.matcher(text);

        if (!matcher.find()) {
            return null;
        }

        String rawValue =
                matcher.group(1)
                        .replace(',', '.');

        return Double.parseDouble(rawValue);
    }

    private Double normalizeRating(
            Double rating) {

        if (rating == null) {
            return null;
        }

        return Math.min(
                Math.max(rating, 0.0),
                10.0
        );
    }
}