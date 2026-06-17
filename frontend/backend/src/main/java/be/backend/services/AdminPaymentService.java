package be.backend.services;

import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.response.PageResponse;

/**
 * Admin Payment Service
 * Provides payment management operations for administrators
 */
public interface AdminPaymentService {
    
    /**
     * Get all payments with filters and pagination
     */
    PageResponse<AdminPaymentDto> getAllPayments(int page, int size, String status, Integer userId, String planType);
    
    /**
     * Get detailed payment information
     */
    AdminPaymentDto getPaymentDetail(Integer paymentId);
    
    /**
     * Update payment status (manual intervention)
     */
    AdminPaymentDto updatePaymentStatus(Integer paymentId, String newStatus);
}
