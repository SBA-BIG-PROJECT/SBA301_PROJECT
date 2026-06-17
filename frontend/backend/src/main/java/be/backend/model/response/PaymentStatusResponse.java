package be.backend.model.response;

import lombok.Builder;

import java.time.Instant;

@Builder
public record PaymentStatusResponse(
        int orderCode,
        String status,        // PENDING | SUCCESS | FAILED | CANCELLED | EXPIRED
        boolean paid,         // true once status == SUCCESS
        String planType,
        Instant paidAt,
        Instant expiresAt     // premium expiry granted by this payment
) {}