package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class GenreIntentResolver implements IntentResolver {

    private static final Map<String, List<String>> GENRES =
            Map.ofEntries(

                    Map.entry("anime", List.of("Animation")),
                    Map.entry("animation", List.of("Animation")),

                    Map.entry("hành động", List.of("Action")),
                    Map.entry("action", List.of("Action")),

                    Map.entry("kinh dị", List.of("Horror")),
                    Map.entry("horror", List.of("Horror")),

                    Map.entry("hài", List.of("Comedy")),
                    Map.entry("comedy", List.of("Comedy")),

                    Map.entry("phiêu lưu", List.of("Adventure")),

                    Map.entry("viễn tưởng", List.of("Science Fiction")),

                    Map.entry("tình cảm", List.of("Romance")),

                    Map.entry("gia đình", List.of("Family")),

                    Map.entry("bí ẩn", List.of("Mystery")),

                    Map.entry("tâm lý", List.of("Drama")),

                    Map.entry("thriller", List.of("Thriller"))
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

        GENRES.forEach((k, v) -> {

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