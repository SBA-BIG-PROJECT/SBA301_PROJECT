package be.backend.controller;

import be.backend.configuration.CustomUserDetails;
import be.backend.exception.UnauthorizedWebhookException;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.PaymentDto;
import be.backend.model.request.CreatePaymentRequest;
import be.backend.model.request.SePayWebhookRequest;
import be.backend.model.response.CreatePaymentResponse;
import be.backend.model.response.PageResponse;
import be.backend.model.response.PaymentStatusResponse;
import be.backend.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/premium")
    public ResponseEntity<CreatePaymentResponse> createPremium(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                paymentService.createPremiumPayment(principal.getUserId(), request.getPlan()));
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

    @GetMapping("/me")
    public ResponseEntity<List<PaymentDto>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(paymentService.getUserPayments(principal.getUserId()));
    }

    @GetMapping("/{orderCode}/status")
    public ResponseEntity<PaymentStatusResponse> getStatus(@PathVariable Integer orderCode) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(orderCode));
    }

    // --- Admin Methods ---

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<PageResponse<AdminPaymentDto>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String planType,
            @RequestParam(required = false) String search) {
        
        return ResponseEntity.ok(
                paymentService.getAllPaymentsAdmin(page, size, status, userId, planType, search)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/{paymentId}")
    public ResponseEntity<AdminPaymentDto> getPaymentDetail(@PathVariable Integer paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentDetailAdmin(paymentId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{paymentId}/status")
    public ResponseEntity<AdminPaymentDto> updatePaymentStatus(
            @PathVariable Integer paymentId,
            @RequestParam String status) {
        
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }
        
        return ResponseEntity.ok(paymentService.updatePaymentStatusAdmin(paymentId, status.toUpperCase()));
    }
}