package be.backend.services.impl;

import be.backend.configuration.SePayProperties;
import be.backend.entity.Payment;
import be.backend.entity.User;
import be.backend.enums.PaymentStatus;
import be.backend.enums.PremiumPlan;
import be.backend.exception.PaymentProcessingException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.PaymentMapper;
import be.backend.model.dto.PaymentDto;
import be.backend.model.request.CreatePaymentRequest;
import be.backend.model.request.SePayWebhookRequest;
import be.backend.model.response.CreatePaymentResponse;
import be.backend.model.response.PaymentStatusResponse;
import be.backend.repository.PaymentRepository;
import be.backend.repository.UserRepository;
import be.backend.services.PaymentService;
import lombok.RequiredArgsConstructor;
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
public class PaymentServiceImpl implements PaymentService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter SEPAY_DATE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SePayProperties props;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public CreatePaymentResponse createPremiumPayment(CreatePaymentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + request.getUserId()));

        PremiumPlan plan = request.getPlan();
        int orderCode = generateUniqueOrderCode();
        String transferContent = props.getPrefix() + orderCode;     // e.g. "MOVIE172839456"

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
                + "&des=" + enc(transferContent);

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
        // Only money coming IN counts.
        if (tx.getTransferType() == null || !tx.getTransferType().equalsIgnoreCase("in")) {
            return;
        }
        // Skip a bank reference we've already credited (SePay may retry).
        if (tx.getReferenceCode() != null
                && paymentRepository.existsByTransactionId(tx.getReferenceCode())) {
            return;
        }

        Integer orderCode = extractOrderCode(tx);
        if (orderCode == null) return;

        Payment payment = paymentRepository.findByOrderCode(orderCode).orElse(null);
        if (payment == null) return;
        if (PaymentStatus.SUCCESS.name().equals(payment.getStatus())) return;   // idempotent

        // Reject under-payment; leave PENDING so a top-up can still settle it.
        if (tx.getTransferAmount() == null
                || tx.getTransferAmount() < payment.getAmount().longValueExact()) {
            return;
        }

        Instant paidAt = parseDate(tx.getTransactionDate());
        User user = payment.getUser();   // managed within this transaction

        // Stack renewals: still premium → extend from current expiry; else from now.
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
    }

    @Override
    public boolean isValidApiKey(String authorizationHeader) {
        if (authorizationHeader == null || props.getApiKey() == null) return false;
        return authorizationHeader.trim().equals("Apikey " + props.getApiKey());
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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for orderCode: " + orderCode));

        return PaymentStatusResponse.builder()
                .orderCode(payment.getOrderCode())
                .status(payment.getStatus())
                .paid(PaymentStatus.SUCCESS.name().equals(payment.getStatus()))
                .planType(payment.getPlanType())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    // ---------------------------------------------------------------- helpers


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

    /** SePay sends "yyyy-MM-dd HH:mm:ss" with no zone — interpret it as local Vietnam time. */
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

    private int generateUniqueOrderCode() {
        for (int i = 0; i < 8; i++) {
            int code = (int) (System.currentTimeMillis() % 1_000_000_000L)
                    + (int) (Math.random() * 1000);
            if (code > 0 && !paymentRepository.existsByOrderCode(code)) {
                return code;
            }
        }
        throw new PaymentProcessingException("Could not generate a unique order code");
    }
}