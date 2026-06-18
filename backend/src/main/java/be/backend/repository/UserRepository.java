package be.backend.repository;

import be.backend.entity.User;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    // Admin queries
    Page<User> findByDeletedAtIsNull(Pageable pageable);
    
    @Query("""
        SELECT u FROM User u
        WHERE u.deletedAt IS NULL
          AND (:search IS NULL OR 
               LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:role IS NULL OR u.role = :role)
          AND (:isPremium IS NULL OR u.isPremium = :isPremium)
        """)
    Page<User> findByFilters(@Param("search") String search,
                             @Param("role") String role,
                             @Param("isPremium") Boolean isPremium,
                             Pageable pageable);
    
    long countByDeletedAtIsNull();
    long countByDeletedAtIsNullAndIsPremiumTrue();
    long countByDeletedAtIsNullAndCreatedAtAfter(Instant after);
    long countByBannedAtIsNotNull();

    @Query("""
        SELECT u.id, COUNT(DISTINCT r.id), COUNT(DISTINCT w.id), COUNT(DISTINCT v.id), COUNT(DISTINCT p.id), COALESCE(SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END), 0)
        FROM User u
        LEFT JOIN Review r ON r.user.id = u.id
        LEFT JOIN Watchlist w ON w.user.id = u.id
        LEFT JOIN ViewLog v ON v.user.id = u.id
        LEFT JOIN Payment p ON p.user.id = u.id
        WHERE u.id IN :userIds GROUP BY u.id
        """)
    java.util.List<Object[]> findUserStatsBatch(@Param("userIds") java.util.List<Integer> userIds);
}
