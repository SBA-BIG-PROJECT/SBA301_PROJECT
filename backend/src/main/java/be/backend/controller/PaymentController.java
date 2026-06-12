package be.backend.controller;

import be.backend.exception.UnauthorizedWebhookException;
import be.backend.model.dto.PaymentDto;
import be.backend.model.request.CreatePaymentRequest;
import be.backend.model.request.SePayWebhookRequest;
import be.backend.model.response.CreatePaymentResponse;
import be.backend.model.response.PaymentStatusResponse;
import be.backend.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;


    @PostMapping("/premium")
    public ResponseEntity<CreatePaymentResponse> createPremium(
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPremiumPayment(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody SePayWebhookRequest payload) {

        if (!paymentService.isValidApiKey(authorization)) {
            throw new UnauthorizedWebhookException("Invalid SePay API key");
        }
        paymentService.handleSePayWebhook(payload);
        return ResponseEntity.ok(Map.of("success", true));
    }


    @GetMapping("/users/{userId}")
    public ResponseEntity<List<PaymentDto>> getUserPayments(@PathVariable Integer userId) {
        return ResponseEntity.ok(paymentService.getUserPayments(userId));
    }
    @GetMapping("/{orderCode}/status")
    public ResponseEntity<PaymentStatusResponse> getStatus(@PathVariable Integer orderCode) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(orderCode));
    }

}