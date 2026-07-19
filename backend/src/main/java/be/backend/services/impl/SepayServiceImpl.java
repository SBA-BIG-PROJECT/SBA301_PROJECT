package be.backend.services.impl;

import be.backend.configuration.SePayProperties;
import be.backend.entity.Payment;
import be.backend.entity.User;
import be.backend.enums.PaymentStatus;
import be.backend.enums.PremiumPlan;
import be.backend.exception.PaymentProcessingException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.PaymentMapper;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.PaymentDto;
import be.backend.model.request.SePayWebhookRequest;
import be.backend.model.response.CreatePaymentResponse;
import be.backend.model.response.PageResponse;
import be.backend.model.response.PaymentStatusResponse;
import be.backend.repository.PaymentRepository;
import be.backend.repository.UserRepository;
import be.backend.services.NotificationService;
import be.backend.services.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SepayServiceImpl implements PaymentService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter SEPAY_DATE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String API_KEY_PREFIX = "Apikey ";

    private final SePayProperties props;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentMapper paymentMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CreatePaymentResponse createPremiumPayment(Integer userId, PremiumPlan plan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        int orderCode = generateUniqueOrderCode();
        String transferContent = "SEVQR " + props.getPrefix() + orderCode;   // e.g. "MOVIE172839456"

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setPlanType(plan.name());
        payment.setAmount(BigDecimal.valueOf(plan.getPrice()));
        payment.setStatus(PaymentStatus.PENDING.name());
        payment.setOrderCode(orderCode);
        payment.setPaymentLinkId(transferContent);
        payment.setCreatedAt(Instant.now());
        paymentRepository.save(payment);

        String qrImageUrl = props.getQrBaseUrl()
                + "?acc=" + enc(props.getAccountNumber())
                + "&bank=" + enc(props.getBank())
                + "&amount=" + plan.getPrice()
                + "&des=" + enc(transferContent)
                + "&template=compact";

        return CreatePaymentResponse.builder()
                .qrImageUrl(qrImageUrl)
                .transferContent(transferContent)
                .accountNumber(props.getAccountNumber())
                .accountName(props.getAccountName())
                .bank(props.getBank())
                .amount(plan.getPrice())
                .orderCode(orderCode)
                .build();
    }

    @Override
    @Transactional
    public void handleSePayWebhook(SePayWebhookRequest tx) {
        // Chi tinh tien VAO.
        if (tx.getTransferType() == null || !tx.getTransferType().equalsIgnoreCase("in")) {
            return;
        }
        // Bo qua bank reference da credit (SePay co the gui lai).
        if (tx.getReferenceCode() != null
                && paymentRepository.existsByTransactionId(tx.getReferenceCode())) {
            return;
        }

        Integer orderCode = extractOrderCode(tx);
        if (orderCode == null) return;

        Payment payment = paymentRepository.findByOrderCode(orderCode).orElse(null);
        if (payment == null) return;
        if (PaymentStatus.SUCCESS.name().equals(payment.getStatus())) return;   // idempotent

        // Tu choi neu chuyen thieu.
        if (tx.getTransferAmount() == null
                || BigDecimal.valueOf(tx.getTransferAmount()).compareTo(payment.getAmount()) < 0) {
            return;
        }

        Instant paidAt = parseDate(tx.getTransactionDate());
        User user = payment.getUser();

        // Cong don han: con premium thi noi tu ngay het han cu, khong thi tu bay gio.
        Instant base = (user.getPremiumExpiresAt() != null
                && user.getPremiumExpiresAt().isAfter(paidAt))
                ? user.getPremiumExpiresAt()
                : paidAt;
        Instant expiresAt = PremiumPlan.valueOf(payment.getPlanType()).addTo(base);

        payment.setStatus(PaymentStatus.SUCCESS.name());
        payment.setTransactionId(tx.getReferenceCode());
        payment.setPaidAt(paidAt);
        payment.setStartsAt(paidAt);
        payment.setExpiresAt(expiresAt);
        paymentRepository.save(payment);

        user.setIsPremium(true);
        user.setPremiumExpiresAt(expiresAt);
        userRepository.save(user);

        notificationService.createPremiumPaymentSuccessNotification(user);
        log.info("Payment success for orderCode {}: userId={}, plan={}, amount={}, expiresAt={}",
                orderCode, user.getId(), payment.getPlanType(), payment.getAmount(), expiresAt);
    }

    @Override
    public boolean isValidApiKey(String authorizationHeader) {
        if (authorizationHeader == null || props.getApiKey() == null) return false;
        String value = authorizationHeader.trim();
        // Prefix "Apikey " khong phan biet hoa thuong; phan key thi so chinh xac.
        if (value.length() <= API_KEY_PREFIX.length()
                || !value.regionMatches(true, 0, API_KEY_PREFIX, 0, API_KEY_PREFIX.length())) {
            return false;
        }
        return value.substring(API_KEY_PREFIX.length()).equals(props.getApiKey());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentDto> getUserPayments(Integer userId) {
        return paymentMapper.toDtoList(
                paymentRepository.findByUser_IdOrderByCreatedAtDesc(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(Integer orderCode) {
        Payment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + orderCode));

        return PaymentStatusResponse.builder()
                .orderCode(payment.getOrderCode())
                .status(payment.getStatus())
                .paid(PaymentStatus.SUCCESS.name().equals(payment.getStatus()))
                .planType(payment.getPlanType())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    // --- Admin Methods ---

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminPaymentDto> getAllPaymentsAdmin(int page, int size, String status, Integer userId, String planType, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Payment> paymentPage = paymentRepository.findByFilters(status, userId, planType, search, pageable);
        
        Page<AdminPaymentDto> dtoPage = paymentPage.map(paymentMapper::toAdminDto);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPaymentDto getPaymentDetailAdmin(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        return paymentMapper.toAdminDto(payment);
    }

    @Override
    @Transactional
    public AdminPaymentDto updatePaymentStatusAdmin(Integer paymentId, String newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        
        payment.setStatus(newStatus);
        
        Payment updated = paymentRepository.save(payment);
        log.info("Admin updated payment {} status to: {}", paymentId, newStatus);
        
        return paymentMapper.toAdminDto(updated);
    }


    // ---------------------------------------------------------------- helpers

    /** Uu tien field code cua SePay; neu khong co thi rut "<PREFIX><digits>" tu noi dung. */
    private Integer extractOrderCode(SePayWebhookRequest tx) {
        if (tx.getCode() != null) {
            Integer fromCode = digitsToInt(tx.getCode().replaceAll("\\D", ""));
            if (fromCode != null) return fromCode;
        }
        if (tx.getContent() != null) {
            Matcher m = Pattern.compile(Pattern.quote(props.getPrefix()) + "(\\d+)",
                    Pattern.CASE_INSENSITIVE).matcher(tx.getContent());
            if (m.find()) return digitsToInt(m.group(1));
        }
        return null;
    }

    private Integer digitsToInt(String digits) {
        if (digits == null || digits.isEmpty()) return null;
        try {
            long v = Long.parseLong(digits);
            return (v > 0 && v <= Integer.MAX_VALUE) ? (int) v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** SePay gui "yyyy-MM-dd HH:mm:ss" khong co zone -> hieu la gio Viet Nam. */
    private Instant parseDate(String s) {
        try {
            return LocalDateTime.parse(s, SEPAY_DATE).atZone(ZONE).toInstant();
        } catch (Exception e) {
            return Instant.now();
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    /** order_code la INT nen giu duoi 2,147,483,647; retry neu trung. */
    private int generateUniqueOrderCode() {
        for (int i = 0; i < 8; i++) {
            int code = (int) (System.currentTimeMillis() % 1_000_000_000L)
                    + (int) (Math.random() * 1000);
            if (code > 0 && !paymentRepository.existsByOrderCode(code)) {
                return code;
            }
        }
        throw new PaymentProcessingException("Cannot generate a unique order code");
    }
}