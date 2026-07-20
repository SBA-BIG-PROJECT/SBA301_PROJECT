package be.backend.model.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieSearchCriteria {

    /*
     * ===========================
     * BASIC SEARCH
     * ===========================
     */

    private String keyword;

    private String title;

    private String overview;

    /*
     * ===========================
     * GENRE / CATEGORY
     * ===========================
     */

    private List<String> genres;

    private List<String> categories;

    /*
     * ===========================
     * PEOPLE
     * ===========================
     */

    private List<String> actors;

    private List<String> directors;

    /**
     * Fallback nếu AI chỉ biết tên người.
     */
    private String person;

    /**
     * ACTOR / DIRECTOR
     */
    private String role;

    /*
     * ===========================
     * RELEASE
     * ===========================
     */

    private Integer releaseYear;

    private Integer releaseFrom;

    private Integer releaseTo;

    /*
     * ===========================
     * RATING
     * ===========================
     */

    private Double minRating;

    private Double maxRating;

    private Integer minVoteCount;

    /*
     * ===========================
     * MOVIE TYPE
     * ===========================
     */

    /**
     * Anime / Animation
     */
    private Boolean animation;

    /**
     * TV Series
     */
    private Boolean series;

    /**
     * Movie only
     */
    private Boolean movie;

    /*
     * ===========================
     * LANGUAGE
     * ===========================
     */

    private String language;

    /*
     * ===========================
     * COUNTRY
     * ===========================
     */

    private String country;

    /*
     * ===========================
     * PREMIUM
     * ===========================
     */

    private Boolean premium;

    private Boolean active;

    /*
     * ===========================
     * SPECIAL SEARCH
     * ===========================
     */

    /**
     * Trending now
     */
    private Boolean trending;

    /**
     * Hidden gems
     */
    private Boolean hiddenGem;

    /**
     * Oscar winners
     */
    private Boolean awardWinning;

    /**
     * Plot twist / mind blowing
     */
    private Boolean mindBlowing;

    /**
     * Happy ending
     */
    private Boolean happyEnding;

    /**
     * Villain wins
     */
    private Boolean villainWins;

    /*
     * ===========================
     * MOOD
     * ===========================
     */

    /**
     * funny
     * emotional
     * horror
     * relaxing
     * ...
     */
    private String mood;

    /*
     * ===========================
     * WATCH CONTEXT
     * ===========================
     */

    /**
     * family
     * couple
     * alone
     * friends
     */
    private String watchContext;

    /*
     * ===========================
     * SIMILAR MOVIE
     * ===========================
     */

    /**
     * "Like Interstellar"
     */
    private String similarTo;

    /*
     * ===========================
     * SORT
     * ===========================
     */

    /**
     * rating
     * newest
     * popular
     * release
     */
    private String sortBy;

    private Boolean descending;

    /*
     * ===========================
     * PAGING
     * ===========================
     */

    @Builder.Default
    private Integer page = 0;

    @Builder.Default
    private Integer size = 20;

    private Integer limit;

    private Integer minDuration;

    private Integer maxDuration;
}