package be.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Admin view of payment data with user information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentDto {
    private Integer paymentId;
    private Integer userId;
    private String userEmail;
    private String userFullName;
    private String planType;
    private BigDecimal amount;
    private String status;
    private Integer orderCode;
    private String paymentLinkId;
    private String transactionId;
    private Instant paidAt;
    private Instant startsAt;
    private Instant expiresAt;
    private Instant createdAt;
}
