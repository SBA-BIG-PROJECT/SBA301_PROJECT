package be.backend.controller;

import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.response.PageResponse;
import be.backend.services.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin Payment Controller
 * Handles all admin operations related to payment management
 * 
 * Authorization: Requires ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    /**
     * Get all payments with filters
     * GET /api/v1/admin/payments?page=0&size=20&status=SUCCESS&userId=1&planType=MONTHLY
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminPaymentDto>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String planType) {
        
        return ResponseEntity.ok(
                adminPaymentService.getAllPayments(page, size, status, userId, planType)
        );
    }

    /**
     * Get payment detail
     * GET /api/v1/admin/payments/{paymentId}
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<AdminPaymentDto> getPaymentDetail(@PathVariable Integer paymentId) {
        return ResponseEntity.ok(adminPaymentService.getPaymentDetail(paymentId));
    }

    /**
     * Update payment status (manual intervention)
     * PUT /api/v1/admin/payments/{paymentId}/status
     * Body: { "status": "SUCCESS" }
     */
    @PutMapping("/{paymentId}/status")
    public ResponseEntity<AdminPaymentDto> updatePaymentStatus(
            @PathVariable Integer paymentId,
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        
        return ResponseEntity.ok(adminPaymentService.updatePaymentStatus(paymentId, newStatus));
    }
}
