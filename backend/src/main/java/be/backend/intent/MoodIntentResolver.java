package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class MoodIntentResolver implements IntentResolver {

    private static final Map<String, List<String>> MAP =
            Map.ofEntries(

                    Map.entry(
                            "hack não",
                            List.of(
                                    "Science Fiction",
                                    "Mystery",
                                    "Thriller"
                            )
                    ),

                    Map.entry(
                            "plot twist",
                            List.of(
                                    "Mystery",
                                    "Thriller"
                            )
                    ),

                    Map.entry(
                            "muốn khóc",
                            List.of(
                                    "Drama",
                                    "Romance"
                            )
                    ),

                    Map.entry(
                            "chữa lành",
                            List.of(
                                    "Drama",
                                    "Family"
                            )
                    ),

                    Map.entry(
                            "vui",
                            List.of(
                                    "Comedy"
                            )
                    ),

                    Map.entry(
                            "mất ngủ",
                            List.of(
                                    "Horror",
                                    "Thriller"
                            )
                    )

            );

    @Override
    public void resolve(
            String message,
            MovieSearchCriteria criteria) {

        String text =
                message.toLowerCase();

        Set<String> genres =
                new LinkedHashSet<>(
                        Optional.ofNullable(criteria.getGenres())
                                .orElse(List.of())
                );

        MAP.forEach((k, v) -> {

            if (text.contains(k)) {
                genres.addAll(v);
            }

        });

        if (!genres.isEmpty()) {
            criteria.setGenres(
                    new ArrayList<>(genres)
            );
        }

    }

}