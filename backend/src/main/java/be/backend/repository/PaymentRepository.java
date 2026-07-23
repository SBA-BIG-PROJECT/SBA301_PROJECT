package be.backend.repository;

import be.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByOrderCode(Integer orderCode);

    boolean existsByOrderCode(Integer orderCode);

    boolean existsByTransactionId(String transactionId);

    List<Payment> findByUser_IdOrderByCreatedAtDesc(Integer userId);
    List<Payment> findTop10ByUser_IdOrderByCreatedAtDesc(Integer userId);
    long countByUser_Id(Integer userId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status AND p.user.id = :userId")
    BigDecimal sumAmountByStatusAndUser_Id(@Param("status") String status, @Param("userId") Integer userId);
    
    // Admin queries
    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("""
        SELECT p FROM Payment p
        LEFT JOIN p.user u
        WHERE (:status IS NULL OR p.status = :status)
          AND (:userId IS NULL OR p.user.id = :userId)
          AND (:planType IS NULL OR p.planType = :planType)
          AND (
              :search IS NULL OR :search = ''
              OR CAST(p.orderCode AS String) LIKE CONCAT('%', :search, '%')
              OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
              OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY p.createdAt DESC
        """)
    Page<Payment> findByFilters(@Param("status") String status,
                                @Param("userId") Integer userId,
                                @Param("planType") String planType,
                                @Param("search") String search,
                                Pageable pageable);
    
    long countByStatus(String status);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS' AND p.paidAt >= :after")
    BigDecimal sumAmountByStatusAndPaidAtAfter(@Param("after") Instant after);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalRevenue();

    List<Payment> findByStatusAndCreatedAtBefore(String status, Instant cutoff);
    
    @Query("""
        SELECT p.planType, COUNT(p), SUM(p.amount)
        FROM Payment p
        WHERE p.status = 'SUCCESS'
        GROUP BY p.planType
        """)
    List<Object[]> countAndSumByPlanType();

    @Query(value = "SELECT DATE(paid_at) as date, SUM(amount) as revenue, COUNT(*) as orderCount " +
           "FROM payment " +
           "WHERE status = 'SUCCESS' AND paid_at >= :startDate AND paid_at <= :endDate " +
           "GROUP BY DATE(paid_at) " +
           "ORDER BY DATE(paid_at) ASC", nativeQuery = true)
    List<Object[]> getDailyRevenue(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query(value = "SELECT YEAR(paid_at) as year, MONTH(paid_at) as month, SUM(amount) as revenue, COUNT(*) as orderCount " +
           "FROM payment " +
           "WHERE status = 'SUCCESS' AND paid_at >= :startDate AND paid_at <= :endDate " +
           "GROUP BY YEAR(paid_at), MONTH(paid_at) " +
           "ORDER BY YEAR(paid_at) ASC, MONTH(paid_at) ASC", nativeQuery = true)
    List<Object[]> getMonthlyRevenue(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);
}