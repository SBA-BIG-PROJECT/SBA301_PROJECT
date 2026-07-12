package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ContextIntentResolver implements IntentResolver {

    private static final Map<String,List<String>> MAP =
            Map.ofEntries(

                    Map.entry(
                            "người yêu",
                            List.of(
                                    "Romance",
                                    "Comedy"
                            )
                    ),

                    Map.entry(
                            "gia đình",
                            List.of(
                                    "Family",
                                    "Animation"
                            )
                    ),

                    Map.entry(
                            "bạn bè",
                            List.of(
                                    "Comedy",
                                    "Action"
                            )
                    ),

                    Map.entry(
                            "một mình",
                            List.of(
                                    "Drama",
                                    "Mystery"
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

        MAP.forEach((k,v)->{

            if(text.contains(k)){
                genres.addAll(v);
            }

        });

        if(!genres.isEmpty()){
            criteria.setGenres(
                    new ArrayList<>(genres)
            );
        }

    }

}