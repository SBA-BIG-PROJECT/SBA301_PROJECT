package be.backend.repository;

import be.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByOrderCode(Integer orderCode);

    boolean existsByOrderCode(Integer orderCode);


    boolean existsByTransactionId(String transactionId);

    List<Payment> findByUser_IdOrderByCreatedAtDesc(Integer userId);
}