package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "user_activity_stats")
public class UserActivityStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stat_id", nullable = false)
    private Integer id;

    @NotNull
    @Column(name = "date", nullable = false)
    private LocalDate date;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "total_users", nullable = false)
    private Integer totalUsers;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "active_users", nullable = false)
    private Integer activeUsers;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "premium_users", nullable = false)
    private Integer premiumUsers;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "new_users", nullable = false)
    private Integer newUsers;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "total_movies", nullable = false)
    private Integer totalMovies;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "total_views", nullable = false)
    private Integer totalViews;

    @NotNull
    @ColumnDefault("0.00")
    @Column(name = "revenue_vnd", nullable = false, precision = 15, scale = 2)
    private BigDecimal revenueVnd;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

}