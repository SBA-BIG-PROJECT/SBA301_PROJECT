package be.backend.model.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;


@Getter
@Setter
@Builder
public class PaymentDto {
    private Integer paymentId;
    private Integer userId;
    private String planType;
    private BigDecimal amount;
    private String status;
    private Integer orderCode;
    private String transactionId;
    private Instant paidAt;
    private Instant startsAt;
    private Instant expiresAt;
    private Instant createdAt;
}