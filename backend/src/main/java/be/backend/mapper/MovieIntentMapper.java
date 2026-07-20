package be.backend.mapper;

import be.backend.intent.ContextIntentResolver;
import be.backend.intent.CountryIntentResolver;
import be.backend.intent.EntityIntentResolver;
import be.backend.intent.GenreIntentResolver;
import be.backend.intent.MoodIntentResolver;
import be.backend.intent.PersonIntentResolver;
import be.backend.intent.RegexIntentResolver;
import be.backend.intent.SemanticIntentResolver;
import be.backend.intent.TimeIntentResolver;
import be.backend.model.dto.MovieSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MovieIntentMapper {

    private final GenreIntentResolver genreIntentResolver;
    private final MoodIntentResolver moodIntentResolver;
    private final ContextIntentResolver contextIntentResolver;
    private final SemanticIntentResolver semanticIntentResolver;
    private final PersonIntentResolver personIntentResolver;
    private final CountryIntentResolver countryIntentResolver;
    private final EntityIntentResolver entityIntentResolver;
    private final TimeIntentResolver timeIntentResolver;
    private final RegexIntentResolver regexIntentResolver;

    public MovieSearchCriteria map(String message) {

        MovieSearchCriteria criteria =
                MovieSearchCriteria.builder()
                        .active(true)
                        .page(0)
                        .size(20)
                        .build();

        if (message == null || message.isBlank()) {
            return criteria;
        }

        genreIntentResolver.resolve(message, criteria);
        moodIntentResolver.resolve(message, criteria);
        contextIntentResolver.resolve(message, criteria);
        semanticIntentResolver.resolve(message, criteria);
        personIntentResolver.resolve(message, criteria);
        countryIntentResolver.resolve(message, criteria);
        entityIntentResolver.resolve(message, criteria);
        timeIntentResolver.resolve(message, criteria);
        regexIntentResolver.resolve(message, criteria);

        return criteria;
    }
}