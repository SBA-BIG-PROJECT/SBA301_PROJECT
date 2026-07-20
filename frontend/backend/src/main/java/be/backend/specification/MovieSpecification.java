package be.backend.specification;

import be.backend.entity.Category;
import be.backend.entity.Genre;
import be.backend.entity.Movie;
import be.backend.entity.MovieCategory;
import be.backend.entity.MovieGenre;
import be.backend.entity.MoviePerson;
import be.backend.entity.Person;
import be.backend.model.dto.MovieSearchCriteria;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class MovieSpecification {

    private MovieSpecification() {
    }

    public static Specification<Movie> search(
            MovieSearchCriteria criteria) {

        return (root, query, cb) -> {

            MovieSearchCriteria safeCriteria =
                    criteria != null
                            ? criteria
                            : new MovieSearchCriteria();

            List<Predicate> predicates =
                    new ArrayList<>();

            /*
             * ========================================
             * ACTIVE
             * ========================================
             */

            if (safeCriteria.getActive() != null) {
                predicates.add(
                        cb.equal(
                                root.get("isActive"),
                                safeCriteria.getActive()
                        )
                );
            }

            /*
             * ========================================
             * TITLE
             * ========================================
             */

            if (hasText(safeCriteria.getTitle())) {

                String title =
                        "%" + normalize(safeCriteria.getTitle()) + "%";

                predicates.add(
                        cb.like(
                                cb.lower(root.get("title")),
                                title
                        )
                );
            }

            /*
             * ========================================
             * OVERVIEW
             * ========================================
             */

            if (hasText(safeCriteria.getOverview())) {

                String overview =
                        "%" + normalize(safeCriteria.getOverview()) + "%";

                predicates.add(
                        cb.like(
                                cb.lower(
                                        cb.coalesce(
                                                root.<String>get("overview"),
                                                ""
                                        )
                                ),
                                overview
                        )
                );
            }

            /*
             * ========================================
             * KEYWORD: TITLE OR OVERVIEW
             * ========================================
             */

            if (hasText(safeCriteria.getKeyword())) {

                String keyword =
                        "%" + normalize(safeCriteria.getKeyword()) + "%";

                predicates.add(
                        cb.or(
                                cb.like(
                                        cb.lower(root.get("title")),
                                        keyword
                                ),
                                cb.like(
                                        cb.lower(
                                                cb.coalesce(
                                                        root.<String>get("overview"),
                                                        ""
                                                )
                                        ),
                                        keyword
                                )
                        )
                );
            }

            /*
             * ========================================
             * PREMIUM
             * ========================================
             */

            if (safeCriteria.getPremium() != null) {
                predicates.add(
                        cb.equal(
                                root.get("isPremium"),
                                safeCriteria.getPremium()
                        )
                );
            }

            /*
             * ========================================
             * RATING
             * ========================================
             */

            if (safeCriteria.getMinRating() != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("voteAverage"),
                                safeCriteria.getMinRating()
                        )
                );
            }

            if (safeCriteria.getMaxRating() != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.get("voteAverage"),
                                safeCriteria.getMaxRating()
                        )
                );
            }

            /*
             * ========================================
             * VOTE COUNT
             * ========================================
             */

            if (safeCriteria.getMinVoteCount() != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("voteCount"),
                                safeCriteria.getMinVoteCount()
                        )
                );
            }

            /*
             * ========================================
             * RELEASE YEAR
             * ========================================
             */

            if (safeCriteria.getReleaseYear() != null) {
                predicates.add(
                        cb.equal(
                                cb.function(
                                        "YEAR",
                                        Integer.class,
                                        root.get("releaseDate")
                                ),
                                safeCriteria.getReleaseYear()
                        )
                );
            }

            if (safeCriteria.getReleaseFrom() != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                cb.function(
                                        "YEAR",
                                        Integer.class,
                                        root.get("releaseDate")
                                ),
                                safeCriteria.getReleaseFrom()
                        )
                );
            }

            if (safeCriteria.getReleaseTo() != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(
                                cb.function(
                                        "YEAR",
                                        Integer.class,
                                        root.get("releaseDate")
                                ),
                                safeCriteria.getReleaseTo()
                        )
                );
            }

            /*
             * ========================================
             * GENRES
             *
             * Mỗi genre được tạo thành một EXISTS riêng.
             * Vì vậy genres=[Animation, Action]
             * nghĩa là phim phải có CẢ HAI genre.
             * ========================================
             */

            if (safeCriteria.getGenres() != null) {

                safeCriteria.getGenres()
                        .stream()
                        .filter(MovieSpecification::hasText)
                        .map(MovieSpecification::normalize)
                        .distinct()
                        .forEach(genreName -> {

                            Subquery<Integer> genreSubquery =
                                    query.subquery(Integer.class);

                            Root<MovieGenre> movieGenreRoot =
                                    genreSubquery.from(MovieGenre.class);

                            Join<MovieGenre, Genre> genreJoin =
                                    movieGenreRoot.join("genre");

                            genreSubquery.select(
                                    movieGenreRoot
                                            .get("tmdb")
                                            .get("id")
                            );

                            genreSubquery.where(
                                    cb.equal(
                                            movieGenreRoot
                                                    .get("tmdb")
                                                    .get("id"),
                                            root.get("id")
                                    ),
                                    cb.equal(
                                            cb.lower(
                                                    genreJoin.get("name")
                                            ),
                                            genreName
                                    )
                            );

                            predicates.add(
                                    cb.exists(genreSubquery)
                            );
                        });
            }

            /*
             * ========================================
             * CATEGORIES
             *
             * Hỗ trợ cả:
             * - trending
             * - Xu hướng
             * - upcoming
             * - Sắp chiếu
             * ========================================
             */

            if (safeCriteria.getCategories() != null) {

                safeCriteria.getCategories()
                        .stream()
                        .filter(MovieSpecification::hasText)
                        .map(MovieSpecification::normalize)
                        .distinct()
                        .forEach(categoryValue -> {

                            Subquery<Integer> categorySubquery =
                                    query.subquery(Integer.class);

                            Root<MovieCategory> movieCategoryRoot =
                                    categorySubquery.from(MovieCategory.class);

                            Join<MovieCategory, Category> categoryJoin =
                                    movieCategoryRoot.join("category");

                            categorySubquery.select(
                                    movieCategoryRoot
                                            .get("tmdb")
                                            .get("id")
                            );

                            categorySubquery.where(
                                    cb.equal(
                                            movieCategoryRoot
                                                    .get("tmdb")
                                                    .get("id"),
                                            root.get("id")
                                    ),
                                    cb.or(
                                            cb.equal(
                                                    cb.lower(
                                                            categoryJoin.get(
                                                                    "categoryId"
                                                            )
                                                    ),
                                                    categoryValue
                                            ),
                                            cb.equal(
                                                    cb.lower(
                                                            categoryJoin.get(
                                                                    "name"
                                                            )
                                                    ),
                                                    categoryValue
                                            )
                                    )
                            );

                            predicates.add(
                                    cb.exists(categorySubquery)
                            );
                        });
            }

            /*
             * ========================================
             * ACTORS
             *
             * Nếu có nhiều actor thì phim phải chứa
             * tất cả các actor được yêu cầu.
             * ========================================
             */

            if (safeCriteria.getActors() != null) {

                safeCriteria.getActors()
                        .stream()
                        .filter(MovieSpecification::hasText)
                        .map(MovieSpecification::normalize)
                        .distinct()
                        .forEach(actorName -> {

                            Subquery<Integer> actorSubquery =
                                    query.subquery(Integer.class);

                            Root<MoviePerson> moviePersonRoot =
                                    actorSubquery.from(MoviePerson.class);

                            Join<MoviePerson, Person> personJoin =
                                    moviePersonRoot.join("person");

                            actorSubquery.select(
                                    moviePersonRoot
                                            .get("tmdb")
                                            .get("id")
                            );

                            actorSubquery.where(
                                    cb.equal(
                                            moviePersonRoot
                                                    .get("tmdb")
                                                    .get("id"),
                                            root.get("id")
                                    ),
                                    cb.equal(
                                            cb.lower(
                                                    moviePersonRoot.get("role")
                                            ),
                                            "actor"
                                    ),
                                    cb.like(
                                            cb.lower(
                                                    personJoin.get("name")
                                            ),
                                            "%" + actorName + "%"
                                    )
                            );

                            predicates.add(
                                    cb.exists(actorSubquery)
                            );
                        });
            }

            /*
             * ========================================
             * DIRECTORS
             * ========================================
             */

            if (safeCriteria.getDirectors() != null) {

                safeCriteria.getDirectors()
                        .stream()
                        .filter(MovieSpecification::hasText)
                        .map(MovieSpecification::normalize)
                        .distinct()
                        .forEach(directorName -> {

                            Subquery<Integer> directorSubquery =
                                    query.subquery(Integer.class);

                            Root<MoviePerson> moviePersonRoot =
                                    directorSubquery.from(MoviePerson.class);

                            Join<MoviePerson, Person> personJoin =
                                    moviePersonRoot.join("person");

                            directorSubquery.select(
                                    moviePersonRoot
                                            .get("tmdb")
                                            .get("id")
                            );

                            directorSubquery.where(
                                    cb.equal(
                                            moviePersonRoot
                                                    .get("tmdb")
                                                    .get("id"),
                                            root.get("id")
                                    ),
                                    cb.equal(
                                            cb.lower(
                                                    moviePersonRoot.get("role")
                                            ),
                                            "director"
                                    ),
                                    cb.like(
                                            cb.lower(
                                                    personJoin.get("name")
                                            ),
                                            "%" + directorName + "%"
                                    )
                            );

                            predicates.add(
                                    cb.exists(directorSubquery)
                            );
                        });
            }

            /*
             * ========================================
             * PERSON FALLBACK
             *
             * Dùng khi chưa xác định người đó là
             * actor hay director.
             * ========================================
             */

            if (hasText(safeCriteria.getPerson())) {

                String personName =
                        normalize(safeCriteria.getPerson());

                Subquery<Integer> personSubquery =
                        query.subquery(Integer.class);

                Root<MoviePerson> moviePersonRoot =
                        personSubquery.from(MoviePerson.class);

                Join<MoviePerson, Person> personJoin =
                        moviePersonRoot.join("person");

                List<Predicate> personPredicates =
                        new ArrayList<>();

                personPredicates.add(
                        cb.equal(
                                moviePersonRoot
                                        .get("tmdb")
                                        .get("id"),
                                root.get("id")
                        )
                );

                personPredicates.add(
                        cb.like(
                                cb.lower(
                                        personJoin.get("name")
                                ),
                                "%" + personName + "%"
                        )
                );

                if (hasText(safeCriteria.getRole())) {
                    personPredicates.add(
                            cb.equal(
                                    cb.lower(
                                            moviePersonRoot.get("role")
                                    ),
                                    normalize(
                                            safeCriteria.getRole()
                                    )
                            )
                    );
                }

                personSubquery.select(
                        moviePersonRoot
                                .get("tmdb")
                                .get("id")
                );

                personSubquery.where(
                        personPredicates.toArray(
                                new Predicate[0]
                        )
                );

                predicates.add(
                        cb.exists(personSubquery)
                );
            }

            /*
             * ========================================
             * SORT
             *
             * Không orderBy khi Spring đang chạy
             * count query cho Pageable.
             * ========================================
             */

            if (!isCountQuery(query)) {
                applySorting(
                        safeCriteria,
                        root,
                        query,
                        cb
                );
            }

            return cb.and(
                    predicates.toArray(
                            new Predicate[0]
                    )
            );
        };
    }

    private static void applySorting(
            MovieSearchCriteria criteria,
            Root<Movie> root,
            jakarta.persistence.criteria.CriteriaQuery<?> query,
            jakarta.persistence.criteria.CriteriaBuilder cb) {

        boolean descending =
                criteria.getDescending() == null
                        || Boolean.TRUE.equals(
                        criteria.getDescending()
                );

        String sortBy =
                hasText(criteria.getSortBy())
                        ? normalize(criteria.getSortBy())
                        : "rating";

        switch (sortBy) {

            case "rating",
                 "top_rated",
                 "top-rated",
                 "highest" ->

                    query.orderBy(
                            descending
                                    ? cb.desc(
                                    root.get("voteAverage")
                            )
                                    : cb.asc(
                                    root.get("voteAverage")
                            )
                    );

            case "popular",
                 "popularity",
                 "most_popular" ->

                    query.orderBy(
                            descending
                                    ? cb.desc(
                                    root.get("voteCount")
                            )
                                    : cb.asc(
                                    root.get("voteCount")
                            )
                    );

            case "release",
                 "release_date",
                 "newest",
                 "latest" ->

                    query.orderBy(
                            descending
                                    ? cb.desc(
                                    root.get("releaseDate")
                            )
                                    : cb.asc(
                                    root.get("releaseDate")
                            )
                    );

            case "oldest" ->

                    query.orderBy(
                            cb.asc(
                                    root.get("releaseDate")
                            )
                    );

            case "title",
                 "name" ->

                    query.orderBy(
                            descending
                                    ? cb.desc(
                                    root.get("title")
                            )
                                    : cb.asc(
                                    root.get("title")
                            )
                    );

            default ->

                    query.orderBy(
                            cb.desc(
                                    root.get("voteAverage")
                            )
                    );
        }
    }

    private static boolean isCountQuery(
            jakarta.persistence.criteria.CriteriaQuery<?> query) {

        Class<?> resultType =
                query.getResultType();

        return resultType == Long.class
                || resultType == long.class;
    }

    private static boolean hasText(
            String value) {

        return value != null
                && !value.isBlank();
    }

    private static String normalize(
            String value) {

        return value
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}