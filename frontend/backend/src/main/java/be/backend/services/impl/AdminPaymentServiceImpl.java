package be.backend.services.impl;

import be.backend.entity.Payment;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.PaymentRepository;
import be.backend.services.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin Payment Service Implementation
 * Handles all admin operations related to payment management
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminPaymentDto> getAllPayments(int page, int size, String status, Integer userId, String planType) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Payment> paymentPage = paymentRepository.findByFilters(status, userId, planType, pageable);
        
        Page<AdminPaymentDto> dtoPage = paymentPage.map(this::toAdminPaymentDto);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentDto getPaymentDetail(Integer paymentId) {
        Payment payment = findPaymentById(paymentId);
        return toAdminPaymentDto(payment);
    }

    @Override
    public AdminPaymentDto updatePaymentStatus(Integer paymentId, String newStatus) {
        Payment payment = findPaymentById(paymentId);
        
        payment.setStatus(newStatus);
        
        Payment updated = paymentRepository.save(payment);
        log.info("Admin updated payment {} status to: {}", paymentId, newStatus);
        
        return toAdminPaymentDto(updated);
    }

    /**
     * Convert Payment entity to AdminPaymentDto
     */
    private AdminPaymentDto toAdminPaymentDto(Payment payment) {
        AdminPaymentDto dto = new AdminPaymentDto();
        dto.setPaymentId(payment.getId());
        dto.setUserId(payment.getUser().getId());
        dto.setUserEmail(payment.getUser().getEmail());
        dto.setUserFullName(payment.getUser().getFullName());
        dto.setPlanType(payment.getPlanType());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getStatus());
        dto.setOrderCode(payment.getOrderCode());
        dto.setPaymentLinkId(payment.getPaymentLinkId());
        dto.setTransactionId(payment.getTransactionId());
        dto.setPaidAt(payment.getPaidAt());
        dto.setStartsAt(payment.getStartsAt());
        dto.setExpiresAt(payment.getExpiresAt());
        dto.setCreatedAt(payment.getCreatedAt());
        return dto;
    }

    /**
     * Find payment by ID or throw exception
     */
    private Payment findPaymentById(Integer paymentId) {
        return paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
    }
}
