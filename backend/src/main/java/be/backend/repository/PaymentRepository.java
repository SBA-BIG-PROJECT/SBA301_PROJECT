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
    
    // Admin queries
    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("""
        SELECT p FROM Payment p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:userId IS NULL OR p.user.id = :userId)
          AND (:planType IS NULL OR p.planType = :planType)
        ORDER BY p.createdAt DESC
        """)
    Page<Payment> findByFilters(@Param("status") String status,
                                @Param("userId") Integer userId,
                                @Param("planType") String planType,
                                Pageable pageable);
    
    long countByStatus(String status);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS' AND p.paidAt >= :after")
    BigDecimal sumAmountByStatusAndPaidAtAfter(@Param("after") Instant after);
    
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal sumTotalRevenue();
    
    long countByStatusAndPaidAtAfter(String status, Instant after);
    
    @Query("""
        SELECT p.planType, COUNT(p), SUM(p.amount)
        FROM Payment p
        WHERE p.status = 'SUCCESS'
        GROUP BY p.planType
        """)
    List<Object[]> countAndSumByPlanType();
}