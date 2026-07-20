package be.backend.model.response;

import lombok.Builder;

@Builder
public record CreatePaymentResponse(
        String qrImageUrl,
        String transferContent,
        String accountNumber,
        String accountName,
        String bank,
        int amount,
        int orderCode
) {}