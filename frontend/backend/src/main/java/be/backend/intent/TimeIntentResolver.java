package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TimeIntentResolver implements IntentResolver {

    private static final Pattern YEAR =
            Pattern.compile("\\b(19\\d{2}|20\\d{2})\\b");

    private static final Pattern RANGE =
            Pattern.compile("(19\\d{2}|20\\d{2})\\s*(?:-|đến|to)\\s*(19\\d{2}|20\\d{2})");

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria) {

        String text = message.toLowerCase();

        //---------------------------------
        // 1995-2005
        //---------------------------------

        Matcher range = RANGE.matcher(text);

        if (range.find()) {

            criteria.setReleaseFrom(
                    Integer.parseInt(range.group(1)));

            criteria.setReleaseTo(
                    Integer.parseInt(range.group(2)));

            return;
        }

        //---------------------------------
        // sau 2020
        //---------------------------------

        if (containsAny(text,
                "sau",
                "after",
                "trở lên",
                ">= ",
                "2020+")) {

            Integer year = extractYear(text);

            if (year != null) {

                criteria.setReleaseFrom(year);

                return;
            }
        }

        //---------------------------------
        // trước 2010
        //---------------------------------

        if (containsAny(text,
                "trước",
                "before",
                "trở xuống",
                "<=")) {

            Integer year = extractYear(text);

            if (year != null) {

                criteria.setReleaseTo(year);

                return;
            }
        }

        //---------------------------------
        // năm 1994
        //---------------------------------

        if (containsAny(text,
                "năm",
                "year")) {

            Integer year = extractYear(text);

            if (year != null) {

                criteria.setReleaseYear(year);

                return;
            }
        }

        //---------------------------------
        // 90s
        //---------------------------------

        if (containsAny(text,
                "90s",
                "thập niên 90")) {

            criteria.setReleaseFrom(1990);
            criteria.setReleaseTo(1999);

            return;
        }

        //---------------------------------
        // 80s
        //---------------------------------

        if (containsAny(text,
                "80s",
                "thập niên 80")) {

            criteria.setReleaseFrom(1980);
            criteria.setReleaseTo(1989);

            return;
        }

        //---------------------------------
        // 2000s
        //---------------------------------

        if (containsAny(text,
                "2000s",
                "thập niên 2000")) {

            criteria.setReleaseFrom(2000);
            criteria.setReleaseTo(2009);

            return;
        }

        //---------------------------------
        // đầu những năm 2000
        //---------------------------------

        if (text.contains("đầu những năm 2000")) {

            criteria.setReleaseFrom(2000);
            criteria.setReleaseTo(2004);

            return;
        }

        //---------------------------------
        // cuối những năm 90
        //---------------------------------

        if (text.contains("cuối thập niên 90")) {

            criteria.setReleaseFrom(1997);
            criteria.setReleaseTo(1999);

            return;
        }

        //---------------------------------
        // phim mới nhất
        //---------------------------------

        if (containsAny(text,
                "mới nhất",
                "newest",
                "latest")) {

            criteria.setSortBy("release");
            criteria.setDescending(true);

            criteria.setReleaseFrom(
                    Year.now().getValue() - 2);

            return;
        }

        //---------------------------------
        // phim gần đây
        //---------------------------------

        if (containsAny(text,
                "gần đây",
                "recent")) {

            criteria.setReleaseFrom(
                    Year.now().getValue() - 5);

            criteria.setSortBy("release");
            criteria.setDescending(true);

            return;
        }

        //---------------------------------
        // phim cũ
        //---------------------------------

        if (containsAny(text,
                "phim cũ",
                "old movie",
                "classic")) {

            criteria.setReleaseTo(1999);

            return;
        }

        //---------------------------------
        // chỉ nhập 1994
        //---------------------------------

        Integer year = extractYear(text);

        if (year != null) {

            criteria.setReleaseYear(year);

        }

    }

    //---------------------------------

    private Integer extractYear(String text) {

        Matcher matcher = YEAR.matcher(text);

        if (matcher.find()) {

            return Integer.parseInt(matcher.group());

        }

        return null;

    }

    //---------------------------------

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