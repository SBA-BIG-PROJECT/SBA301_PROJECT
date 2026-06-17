package be.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private Integer id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "age")
    private Integer age;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "avatar_public_id")
    private String avatarPublicId;

    @ColumnDefault("'USER'")
    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @ColumnDefault("0")
    @Column(name = "is_premium", nullable = false)
    private Boolean isPremium = false;

    @Column(name = "premium_expires_at")
    private Instant premiumExpiresAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // Admin fields from V9 migration
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "banned_at")
    private Instant bannedAt;

    @Column(name = "banned_reason", length = 500)
    private String bannedReason;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<ChatSession> chatSessions = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "added_by")
    private Set<Movie> movies = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<Notification> notifications = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<Payment> payments = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<Recommendation> recommendations = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<Review> reviews = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<ViewLog> viewLogs = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "user_id")
    private Set<Watchlist> watchlists = new LinkedHashSet<>();

}