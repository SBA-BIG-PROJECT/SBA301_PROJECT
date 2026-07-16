package be.backend.intent;

import be.backend.model.dto.MovieSearchCriteria;

public interface IntentResolver {

    void resolve(
            String message,
            MovieSearchCriteria criteria
    );

}