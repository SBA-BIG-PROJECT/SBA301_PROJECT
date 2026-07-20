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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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
             * COUNTRY (keyword-style fallback)
             *
             * Movie entity currently has no dedicated country column,
             * so country filtering matches known aliases in
             * title/overview.
             * ========================================
             */

            if (hasText(safeCriteria.getCountry())) {

                List<Predicate> countryPredicates =
                        countryAliases(
                                safeCriteria.getCountry()
                        )
                                .stream()
                                .map(alias -> {
                                    String likeValue = "%" + alias + "%";

                                    return cb.or(
                                            cb.like(
                                                    cb.lower(root.get("title")),
                                                    likeValue
                                            ),
                                            cb.like(
                                                    cb.lower(
                                                            cb.coalesce(
                                                                    root.<String>get("overview"),
                                                                    ""
                                                            )
                                                    ),
                                                    likeValue
                                            )
                                    );
                                })
                                .toList();

                predicates.add(
                        cb.or(
                                countryPredicates.toArray(
                                        new Predicate[0]
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
                                    buildGenreNamePredicate(
                                            cb,
                                            genreJoin,
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

    private static Predicate buildGenreNamePredicate(
            jakarta.persistence.criteria.CriteriaBuilder cb,
            Join<MovieGenre, Genre> genreJoin,
            String requestedGenre
    ) {

        List<Predicate> namePredicates =
                genreAliases(requestedGenre)
                        .stream()
                        .map(alias ->
                                cb.equal(
                                        cb.lower(genreJoin.get("name")),
                                        alias
                                )
                        )
                        .toList();

        return cb.or(namePredicates.toArray(new Predicate[0]));
    }

    private static Set<String> genreAliases(
            String requestedGenre
    ) {

        String normalized = normalize(requestedGenre);

        Set<String> aliases =
                new LinkedHashSet<>();

        aliases.add(normalized);

        switch (normalized) {

            case "comedy" -> {
                aliases.add("hài");
                aliases.add("phim hài");
            }

            case "animation" -> {
                aliases.add("hoạt hình");
                aliases.add("phim hoạt hình");
                aliases.add("anime");
            }

            case "action" -> {
                aliases.add("hành động");
                aliases.add("phim hành động");
            }

            case "horror" -> {
                aliases.add("kinh dị");
                aliases.add("phim kinh dị");
            }

            case "romance" -> {
                aliases.add("tình cảm");
                aliases.add("lãng mạn");
            }

            case "drama" -> {
                aliases.add("chính kịch");
                aliases.add("tâm lý");
            }

            case "science fiction" -> {
                aliases.add("sci-fi");
                aliases.add("khoa học viễn tưởng");
                aliases.add("viễn tưởng");
            }

            case "adventure" -> aliases.add("phiêu lưu");

            case "mystery" -> aliases.add("bí ẩn");

            case "family" -> aliases.add("gia đình");

            case "thriller" -> {
                aliases.add("gây cấn");
                aliases.add("giật gân");
            }

            case "fantasy" -> {
                aliases.add("giả tưởng");
                aliases.add("giả tượng");
            }

            case "crime" -> aliases.add("hình sự");

            case "history" -> aliases.add("lịch sử");

            case "documentary" -> aliases.add("tài liệu");

            case "war" -> aliases.add("chiến tranh");

            case "western" -> aliases.add("miền tây");

            case "tv movie" -> aliases.add("phim truyền hình");

            default -> {
                // Keep original normalized genre only.
            }
        }

        return aliases;
    }

    private static Set<String> countryAliases(
            String country
    ) {

        String normalized = normalize(country);

        Set<String> aliases =
                new LinkedHashSet<>();

        aliases.add(normalized);

        switch (normalized) {

            case "japan" -> {
                aliases.add("japanese");
                aliases.add("nhat");
                aliases.add("nhat ban");
                aliases.add("nhật");
                aliases.add("nhật bản");
            }

            case "south korea" -> {
                aliases.add("korea");
                aliases.add("korean");
                aliases.add("han");
                aliases.add("han quoc");
                aliases.add("hàn");
                aliases.add("hàn quốc");
            }

            case "united states" -> {
                aliases.add("usa");
                aliases.add("american");
                aliases.add("hoa ky");
                aliases.add("my");
                aliases.add("mỹ");
                aliases.add("hoa kỳ");
            }

            case "vietnam" -> {
                aliases.add("viet nam");
                aliases.add("vietnamese");
                aliases.add("viet");
                aliases.add("việt nam");
                aliases.add("việt");
            }

            case "china" -> {
                aliases.add("chinese");
                aliases.add("trung");
                aliases.add("trung quoc");
                aliases.add("trung quốc");
            }

            case "thailand" -> {
                aliases.add("thai");
                aliases.add("thai lan");
                aliases.add("thái");
                aliases.add("thái lan");
            }

            case "france" -> {
                aliases.add("french");
                aliases.add("phap");
                aliases.add("pháp");
            }

            case "united kingdom" -> {
                aliases.add("uk");
                aliases.add("british");
                aliases.add("anh");
            }

            default -> {
                // Keep original normalized country only.
            }
        }

        return aliases;
    }
}