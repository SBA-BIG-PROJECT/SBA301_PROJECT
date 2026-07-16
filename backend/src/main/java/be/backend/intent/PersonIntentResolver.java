package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PersonIntentResolver implements IntentResolver {

    private static final String ROLE_ACTOR = "ACTOR";
    private static final String ROLE_DIRECTOR = "DIRECTOR";

    private static final Pattern MOVIE_BY_DIRECTOR_PATTERN =
            Pattern.compile("(?iu)\\bphim\\s+của\\s+đạo\\s*diễn\\s+(.+)");

    private static final Pattern MOVIE_DO_DIRECTED_PATTERN =
            Pattern.compile("(?iu)\\bphim\\s+do\\s+(.+?)\\s+đạo\\s*diễn\\b");

    private static final Pattern MOVIE_WITH_ACTOR_PATTERN =
            Pattern.compile("(?iu)\\bphim\\s+có\\s+diễn\\s*viên\\s+(.+)");

    private static final Pattern DIRECTOR_PREFIX_PATTERN =
            Pattern.compile("(?iu)\\b(?:đạo\\s*diễn|director)\\s+([\\p{L}\\p{M}.'’-]+(?:\\s+[\\p{L}\\p{M}.'’-]+)+)");

    private static final Pattern DIRECTED_BY_PATTERN =
            Pattern.compile("(?iu)\\bdirected\\s+by\\s+(.+)");

    private static final Pattern ACTOR_PREFIX_PATTERN =
            Pattern.compile("(?iu)\\b(?:diễn\\s*viên|actor|actress|starring)\\s+([\\p{L}\\p{M}.'’-]+(?:\\s+[\\p{L}\\p{M}.'’-]+)+)");

    private static final Pattern STARRING_PREFIX_PATTERN =
            Pattern.compile("(?iu)\\bstarring\\s+(.+)");

    private static final Pattern DONG_BOI_PATTERN =
            Pattern.compile("(?iu)\\bđóng\\s+bởi\\s+(.+)");

    private static final Pattern MOVIES_BY_PATTERN =
            Pattern.compile("(?iu)\\bmovies?\\s+by\\s+(.+)");

    private static final Pattern MOVIE_BY_PATTERN =
            Pattern.compile("(?iu)\\bmovie\\s+by\\s+(.+)");

    private static final Pattern MOVIES_WITH_PATTERN =
            Pattern.compile("(?iu)\\bmovies?\\s+with\\s+(.+)");

    private static final Pattern MOVIE_WITH_PATTERN =
            Pattern.compile("(?iu)\\bmovie\\s+with\\s+(.+)");

    private static final Pattern MOVIE_STARRING_PATTERN =
            Pattern.compile("(?iu)\\bmovies?\\s+starring\\s+(.+)");

    private static final Pattern MOVIE_CUA_PATTERN =
            Pattern.compile("(?iu)\\bphim\\s+của\\s+(.+)");

    private static final Pattern MOVIE_CO_PATTERN =
            Pattern.compile("(?iu)\\bphim\\s+có\\s+(.+)");

    private static final Pattern MOVIE_PERSON_PHRASE_PATTERN =
            Pattern.compile("(?iu)^\\s*phim\\s+([\\p{L}\\p{M}.'’-]+(?:\\s+[\\p{L}\\p{M}.'’-]+){1,4})\\s*$");

    private static final Pattern BARE_PERSON_PATTERN =
            Pattern.compile("^\\s*([\\p{L}\\p{M}.'’-]+(?:\\s+[\\p{L}\\p{M}.'’-]+){1,4})\\s*$");

    private static final Pattern PERSON_SEPARATOR_PATTERN =
            Pattern.compile("(?iu)\\s*(?:,|&| and | và )\\s*");

    private static final List<String> PERSON_TAIL_STOP_PHRASES =
            List.of(
                    "sau năm",
                    "trước năm",
                    "từ năm",
                    "năm",
                    "điểm",
                    "rating",
                    "imdb",
                    "top",
                    "thể loại",
                    "genre",
                    "premium",
                    "đánh giá cao",
                    "mới nhất",
                    "sắp chiếu",
                    "xu hướng",
                    "trending",
                    "nhưng",
                    "after",
                    "before",
                    "from",
                    "year",
                    "score"
            );

    private static final Pattern TRAILING_PUNCTUATION_PATTERN =
            Pattern.compile("[?!.,:;]+$");

    private static final List<String> INVALID_PERSON_PHRASES =
            List.of(
                    "hành động",
                    "kinh dị",
                    "hài",
                    "anime",
                    "animation",
                    "action",
                    "comedy",
                    "romance",
                    "thriller",
                    "drama",
                    "crime",
                    "history",
                    "war",
                    "fantasy",
                    "science fiction",
                    "mystery",
                    "family",
                    "documentary",
                    "tv movie",
                    "western",
                    "adventure",
                    "năm 1994",
                    "hack não",
                    "chữa lành",
                    "mới nhất",
                    "xu hướng",
                    "sắp chiếu",
                    "tâm lý",
                    "khoa học",
                    "hay"
            );

    private static final List<Pattern> DIRECTOR_ROLE_PATTERNS =
            List.of(
                    MOVIE_BY_DIRECTOR_PATTERN,
                    MOVIE_DO_DIRECTED_PATTERN,
                    DIRECTED_BY_PATTERN,
                    DIRECTOR_PREFIX_PATTERN
            );

    private static final List<Pattern> ACTOR_ROLE_PATTERNS =
            List.of(
                    MOVIE_WITH_ACTOR_PATTERN,
                    ACTOR_PREFIX_PATTERN,
                    STARRING_PREFIX_PATTERN,
                    DONG_BOI_PATTERN,
                    MOVIE_STARRING_PATTERN
            );

    private static final List<Pattern> DIRECTOR_PERSON_PATTERNS =
            List.of(
                    MOVIE_BY_DIRECTOR_PATTERN,
                    MOVIE_DO_DIRECTED_PATTERN,
                    DIRECTED_BY_PATTERN,
                    DIRECTOR_PREFIX_PATTERN
            );

    private static final List<Pattern> ACTOR_PERSON_PATTERNS =
            List.of(
                    MOVIE_WITH_ACTOR_PATTERN,
                    ACTOR_PREFIX_PATTERN,
                    STARRING_PREFIX_PATTERN,
                    DONG_BOI_PATTERN,
                    MOVIE_STARRING_PATTERN
            );

    private static final List<Pattern> GENERIC_PERSON_PATTERNS =
            List.of(
                    MOVIE_CUA_PATTERN,
                    MOVIES_BY_PATTERN,
                    MOVIE_BY_PATTERN,
                    MOVIES_WITH_PATTERN,
                    MOVIE_WITH_PATTERN,
                    MOVIE_PERSON_PHRASE_PATTERN
            );

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

        String normalizedMessage = message.trim();

        String detectedRole = detectRole(normalizedMessage);

        if (criteria.getPerson() != null
                && !criteria.getPerson().isBlank()) {

            if (detectedRole != null) {
                criteria.setRole(detectedRole);
            }

            return;
        }

        ExtractionResult extractionResult = extractPerson(normalizedMessage);

        if (detectedRole == null) {
            detectedRole = extractionResult.role();
        }

        if (detectedRole != null) {
            criteria.setRole(detectedRole);
        }

        String person = extractionResult.primaryPerson();

        if (person == null) {
            person = extractBarePersonName(normalizedMessage);
        }

        if (person == null
                || isInvalidPersonCandidate(person)) {

            return;
        }

        criteria.setPerson(person);

        if (detectedRole != null
                && extractionResult.names().size() > 1) {

            if (ROLE_ACTOR.equals(detectedRole)) {
                criteria.setActors(extractionResult.names());
            }

            if (ROLE_DIRECTOR.equals(detectedRole)) {
                criteria.setDirectors(extractionResult.names());
            }
        }
    }

    private ExtractionResult extractPerson(String message) {

        ExtractionResult directorResult =
                extractFromPatterns(message, DIRECTOR_PERSON_PATTERNS, ROLE_DIRECTOR);

        if (directorResult.primaryPerson() != null) {
            return directorResult;
        }

        ExtractionResult actorResult =
                extractFromPatterns(message, ACTOR_PERSON_PATTERNS, ROLE_ACTOR);

        if (actorResult.primaryPerson() != null) {
            return actorResult;
        }

        return extractFromPatterns(message, GENERIC_PERSON_PATTERNS, null);
    }

    private ExtractionResult extractFromPatterns(
            String message,
            List<Pattern> patterns,
            String role
    ) {

        for (Pattern pattern : patterns) {

            Matcher matcher = pattern.matcher(message);

            if (!matcher.find()) {
                continue;
            }

            String rawCandidate = cleanPersonName(matcher.group(1));

            if (rawCandidate == null) {
                continue;
            }

            String trimmedCandidate = trimAtStopPhrase(rawCandidate);

            if (trimmedCandidate == null) {
                continue;
            }

            List<String> names = splitPersonNames(trimmedCandidate);

            if (names.isEmpty()) {
                continue;
            }

            return new ExtractionResult(
                    names.get(0),
                    names,
                    role
            );
        }

        return ExtractionResult.empty();
    }

    private String extractBarePersonName(String message) {

        Matcher matcher = BARE_PERSON_PATTERN.matcher(message);

        if (!matcher.matches()) {
            return null;
        }

        String candidate = cleanPersonName(matcher.group(1));

        if (candidate == null
                || isInvalidPersonCandidate(candidate)
                || candidate.toLowerCase(Locale.ROOT).startsWith("phim ")
                || candidate.toLowerCase(Locale.ROOT).startsWith("movie ")
                || candidate.toLowerCase(Locale.ROOT).startsWith("movies ")) {

            return null;
        }

        if (!looksLikePersonName(candidate)) {
            return null;
        }

        return candidate;
    }

    private boolean looksLikePersonName(String candidate) {

        String[] parts = candidate.split("\\s+");

        if (parts.length < 2) {
            return false;
        }

        int capitalizedParts = 0;

        for (String part : parts) {

            if (part.isBlank()) {
                continue;
            }

            char first = part.charAt(0);

            if (Character.isUpperCase(first)) {
                capitalizedParts++;
            }
        }

        return capitalizedParts >= 2;
    }

    private List<String> splitPersonNames(String candidate) {

        String[] rawParts = PERSON_SEPARATOR_PATTERN.split(candidate);
        List<String> names = new ArrayList<>();

        for (String rawPart : rawParts) {

            String cleanedName = cleanPersonName(rawPart);

            if (cleanedName == null
                    || isInvalidPersonCandidate(cleanedName)) {

                continue;
            }

            names.add(cleanedName);
        }

        return names;
    }

    private String detectRole(String message) {

        for (Pattern pattern : DIRECTOR_ROLE_PATTERNS) {

            if (pattern.matcher(message).find()) {
                return ROLE_DIRECTOR;
            }
        }

        for (Pattern pattern : ACTOR_ROLE_PATTERNS) {

            if (pattern.matcher(message).find()) {
                return ROLE_ACTOR;
            }
        }

        return null;
    }

    private String cleanPersonName(String candidate) {

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

    private String trimAtStopPhrase(String candidate) {

        String lowered = candidate.toLowerCase(Locale.ROOT);
        int cutIndex = -1;

        for (String phrase : PERSON_TAIL_STOP_PHRASES) {

            int currentIndex = lowered.indexOf(" " + phrase);

            if (currentIndex >= 0
                    && (cutIndex < 0 || currentIndex < cutIndex)) {

                cutIndex = currentIndex;
            }
        }

        if (cutIndex < 0) {
            return candidate;
        }

        return cleanPersonName(
                candidate.substring(0, cutIndex)
        );
    }

    private boolean isInvalidPersonCandidate(String personName) {

        String lowered =
                personName
                        .toLowerCase(Locale.ROOT)
                        .trim()
                        .replaceAll("\\s+", " ");

        return INVALID_PERSON_PHRASES.contains(lowered)
                || lowered.startsWith("phim ")
                || lowered.startsWith("movie ")
                || lowered.startsWith("movies ");
    }

    private record ExtractionResult(
            String primaryPerson,
            List<String> names,
            String role
    ) {

        private static ExtractionResult empty() {
            return new ExtractionResult(null, List.of(), null);
        }
    }
}

