package be.backend.services;

import be.backend.model.dto.PaymentDto;
import be.backend.model.request.CreatePaymentRequest;
import be.backend.model.request.SePayWebhookRequest;
import be.backend.model.response.CreatePaymentResponse;
import be.backend.model.response.PaymentStatusResponse;

import java.util.List;

public interface PaymentService {

    /** Creates a PENDING payment and returns VietQR + transfer details. */
    CreatePaymentResponse createPremiumPayment(CreatePaymentRequest request);

    /** Processes a SePay transfer notification; grants premium on a valid match. */
    void handleSePayWebhook(SePayWebhookRequest payload);

    /** Validates the "Authorization: Apikey <key>" header SePay sends. */
    boolean isValidApiKey(String authorizationHeader);

    /** Lists a user's payment history. */
    List<PaymentDto> getUserPayments(Integer userId);

    PaymentStatusResponse getPaymentStatus(Integer orderCode);
}