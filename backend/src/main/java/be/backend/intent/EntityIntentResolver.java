package be.backend.intent;

import be.backend.entity.Movie;
import be.backend.entity.Person;
import be.backend.model.dto.MovieSearchCriteria;
import be.backend.repository.MovieRepository;
import be.backend.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class EntityIntentResolver implements IntentResolver {

    private static final int MAX_CANDIDATE_LENGTH = 150;

    private static final Pattern TOP_PREFIX_PATTERN =
            Pattern.compile("(?iu)^\\s*top\\s*\\d+\\s+");

    private static final Pattern TRAILING_PUNCTUATION_PATTERN =
            Pattern.compile("[?!.,:;]+$");

    private static final Pattern YEAR_ONLY_PATTERN =
            Pattern.compile("^(19\\d{2}|20\\d{2})$");

    private static final Pattern RELATED_MOVIE_PATTERN =
            Pattern.compile(
                    "(?iu)^\\s*có\\s+phim\\s+nào\\s+"
                            + "(?:liên\\s+quan\\s+(?:đến|tới)|về)\\s+"
                            + "(.+?)(?:\\s+không)?[?!.,]*\\s*$"
            );

    private static final List<String> ENTITY_PREFIXES =
            List.of(
                    "tìm giúp tôi phim ",
                    "thông tin phim ",
                    "movie called ",
                    "movie named ",
                    "cho tôi phim ",
                    "tìm phim ",
                    "có phim ",
                    "xem phim ",
                    "phim tên ",
                    "movie ",
                    "film ",
                    "phim "
            );

    private static final List<String> STOP_PHRASES =
            List.of(
                    "sau năm",
                    "trước năm",
                    "từ năm",
                    "đến năm",
                    "năm",
                    "điểm",
                    "rating",
                    "imdb",
                    "top",
                    "premium",
                    "đánh giá cao",
                    "mới nhất",
                    "sắp chiếu",
                    "xu hướng",
                    "trending",
                    "thể loại",
                    "genre",
                    "có điểm",
                    "trên",
                    "dưới",
                    "ít nhất",
                    "tối đa",
                    "nhưng",
                    "chỉ lấy"
            );

    private static final List<String> INVALID_PHRASES =
            List.of(
                    "hành động",
                    "action",
                    "kinh dị",
                    "horror",
                    "hài",
                    "comedy",
                    "tình cảm",
                    "romance",
                    "chính kịch",
                    "drama",
                    "hoạt hình",
                    "animation",
                    "anime",
                    "khoa học viễn tưởng",
                    "science fiction",
                    "sci-fi",
                    "bí ẩn",
                    "mystery",
                    "giật gân",
                    "thriller",
                    "phiêu lưu",
                    "adventure",
                    "gia đình",
                    "family",
                    "hack não",
                    "chữa lành",
                    "muốn khóc",
                    "xem với người yêu",
                    "xem với gia đình",
                    "phim mới nhất",
                    "phim xu hướng",
                    "phim sắp chiếu",
                    "phim năm",
                    "đánh giá cao",
                    "top rated",
                    "premium"
            );

    private static final List<String> GENERIC_QUESTIONS =
            List.of(
                    "phim",
                    "movie",
                    "film",
                    "phim nào",
                    "movie nào",
                    "là ai",
                    "là gì",
                    "có phim nào"
            );

    private final MovieRepository movieRepository;
    private final PersonRepository personRepository;

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria
    ) {

        if (message == null
                || message.isBlank()
                || criteria == null) {

            return;
        }

        if (hasText(criteria.getTitle())
                || hasText(criteria.getPerson())
                || hasText(criteria.getKeyword())) {

            return;
        }

        String candidate = extractCandidate(message);

        if (isInvalidCandidate(candidate)
                || hasSearchIntentWithoutEntity(criteria, candidate)) {

            return;
        }

        Optional<Movie> exactMovie =
                movieRepository.findFirstByTitleIgnoreCaseAndIsActiveTrue(candidate);

        if (exactMovie.isPresent()) {
            criteria.setTitle(exactMovie.get().getTitle());
            return;
        }

        Optional<Person> exactPerson =
                personRepository.findFirstByNameIgnoreCase(candidate);

        if (exactPerson.isPresent()) {
            criteria.setPerson(exactPerson.get().getName());
            return;
        }

        List<Movie> partialMovies =
                movieRepository.findTop5ByTitleContainingIgnoreCaseAndIsActiveTrueOrderByVoteCountDesc(candidate);

        if (partialMovies.size() == 1) {
            criteria.setTitle(partialMovies.get(0).getTitle());
            return;
        }

        if (partialMovies.size() > 1) {
            criteria.setKeyword(candidate);
            return;
        }

        List<Person> partialPeople =
                personRepository.findTop5ByNameContainingIgnoreCase(candidate);

        if (partialPeople.size() == 1) {
            criteria.setPerson(partialPeople.get(0).getName());
            return;
        }

        if (partialPeople.size() > 1) {
            criteria.setPerson(candidate);
            return;
        }

        criteria.setKeyword(candidate);
    }

    private String extractCandidate(String message) {

        Matcher relatedMatcher =
                RELATED_MOVIE_PATTERN.matcher(message);

        if (relatedMatcher.find()) {

            return cleanCandidate(
                    relatedMatcher.group(1)
            );
        }

        String candidate = message.trim();

        candidate = TOP_PREFIX_PATTERN.matcher(candidate).replaceFirst("");
        candidate = stripPrefix(candidate);
        candidate = trimAtStopPhrase(candidate);

        return cleanCandidate(candidate);
    }

    private String stripPrefix(String text) {

        String trimmed = text.trim();
        String lowered = trimmed.toLowerCase(Locale.ROOT);

        for (String prefix : ENTITY_PREFIXES) {

            if (lowered.startsWith(prefix)) {
                return trimmed.substring(prefix.length());
            }
        }

        return trimmed;
    }

    private String trimAtStopPhrase(String candidate) {

        String lowered = candidate.toLowerCase(Locale.ROOT);
        int cutIndex = -1;

        for (String phrase : STOP_PHRASES) {

            int index = lowered.indexOf(" " + phrase);

            if (index < 0 && lowered.startsWith(phrase)) {
                index = 0;
            }

            if (index >= 0
                    && (cutIndex < 0 || index < cutIndex)) {

                cutIndex = index;
            }
        }

        if (cutIndex < 0) {
            return candidate;
        }

        return candidate.substring(0, cutIndex);
    }

    private String cleanCandidate(String candidate) {

        if (candidate == null) {
            return null;
        }

        String cleaned = candidate.trim();

        if (cleaned.isEmpty()) {
            return null;
        }

        cleaned = TRAILING_PUNCTUATION_PATTERN
                .matcher(cleaned)
                .replaceAll("")
                .trim()
                .replaceAll("\\s+", " ");

        if (cleaned.isBlank()) {
            return null;
        }

        return cleaned;
    }

    private boolean isInvalidCandidate(String candidate) {

        if (candidate == null
                || candidate.isBlank()) {

            return true;
        }

        if (candidate.length() < 2
                || candidate.length() > MAX_CANDIDATE_LENGTH) {

            return true;
        }

        String lowered = candidate.toLowerCase(Locale.ROOT);

        if (YEAR_ONLY_PATTERN.matcher(lowered).matches()) {
            return true;
        }

        if (GENERIC_QUESTIONS.contains(lowered)) {
            return true;
        }

        return INVALID_PHRASES.stream()
                .anyMatch(invalid ->
                        lowered.equals(invalid)
                                || lowered.startsWith(invalid + " ")
                                || lowered.endsWith(" " + invalid)
                );
    }

    private boolean hasSearchIntentWithoutEntity(
            MovieSearchCriteria criteria,
            String candidate
    ) {

        if (candidate == null || candidate.isBlank()) {
            return true;
        }

        boolean alreadyHasGenreIntent =
                criteria.getGenres() != null
                        && !criteria.getGenres().isEmpty();

        boolean alreadyHasMoodIntent =
                criteria.getMood() != null
                        && !criteria.getMood().isBlank();

        boolean alreadyHasContextIntent =
                criteria.getWatchContext() != null
                        && !criteria.getWatchContext().isBlank();

        boolean alreadyHasCountryIntent =
                criteria.getCountry() != null
                        && !criteria.getCountry().isBlank();

        if (!alreadyHasGenreIntent
                && !alreadyHasMoodIntent
                && !alreadyHasContextIntent
                && !alreadyHasCountryIntent) {

            return false;
        }

        String lowered = candidate.toLowerCase(Locale.ROOT);

        return INVALID_PHRASES.stream()
                .anyMatch(invalid ->
                        lowered.equals(invalid)
                                || lowered.contains(invalid + " ")
                                || lowered.contains(" " + invalid)
                );
    }

    private boolean hasText(String value) {

        return value != null
                && !value.isBlank();
    }
}
