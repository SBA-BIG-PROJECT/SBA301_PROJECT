package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Component
public class CountryIntentResolver implements IntentResolver {

    private static final Map<String, String> COUNTRY_KEYWORDS =
            new LinkedHashMap<>();

    static {
        COUNTRY_KEYWORDS.put("nhat ban", "Japan");
        COUNTRY_KEYWORDS.put("nhat", "Japan");
        COUNTRY_KEYWORDS.put("japan", "Japan");
        COUNTRY_KEYWORDS.put("japanese", "Japan");

        COUNTRY_KEYWORDS.put("han quoc", "South Korea");
        COUNTRY_KEYWORDS.put("han", "South Korea");
        COUNTRY_KEYWORDS.put("south korea", "South Korea");
        COUNTRY_KEYWORDS.put("korea", "South Korea");
        COUNTRY_KEYWORDS.put("korean", "South Korea");

        COUNTRY_KEYWORDS.put("hoa ky", "United States");
        COUNTRY_KEYWORDS.put("my", "United States");
        COUNTRY_KEYWORDS.put("usa", "United States");
        COUNTRY_KEYWORDS.put("united states", "United States");
        COUNTRY_KEYWORDS.put("american", "United States");

        COUNTRY_KEYWORDS.put("viet nam", "Vietnam");
        COUNTRY_KEYWORDS.put("viet", "Vietnam");
        COUNTRY_KEYWORDS.put("vietnam", "Vietnam");
        COUNTRY_KEYWORDS.put("vietnamese", "Vietnam");

        COUNTRY_KEYWORDS.put("trung quoc", "China");
        COUNTRY_KEYWORDS.put("trung", "China");
        COUNTRY_KEYWORDS.put("china", "China");
        COUNTRY_KEYWORDS.put("chinese", "China");

        COUNTRY_KEYWORDS.put("thai lan", "Thailand");
        COUNTRY_KEYWORDS.put("thai", "Thailand");
        COUNTRY_KEYWORDS.put("thailand", "Thailand");

        COUNTRY_KEYWORDS.put("phap", "France");
        COUNTRY_KEYWORDS.put("france", "France");
        COUNTRY_KEYWORDS.put("french", "France");

        COUNTRY_KEYWORDS.put("anh", "United Kingdom");
        COUNTRY_KEYWORDS.put("uk", "United Kingdom");
        COUNTRY_KEYWORDS.put("united kingdom", "United Kingdom");
        COUNTRY_KEYWORDS.put("british", "United Kingdom");
    }

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria) {

        if (message == null
                || message.isBlank()
                || criteria == null) {

            return;
        }

        String normalized = normalizeText(message);

        for (Map.Entry<String, String> entry : COUNTRY_KEYWORDS.entrySet()) {

            if (containsKeyword(normalized, entry.getKey())) {
                criteria.setCountry(entry.getValue());
                return;
            }
        }
    }

    private boolean containsKeyword(
            String text,
            String keyword) {

        String paddedText = " " + text + " ";
        String paddedKeyword = " " + keyword + " ";

        return paddedText.contains(paddedKeyword);
    }

    private String normalizeText(String value) {

        String noAccent = Normalizer
                .normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return noAccent
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}

