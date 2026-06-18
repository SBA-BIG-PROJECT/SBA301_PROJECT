package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.entity.Payment;
import be.backend.entity.Review;
import be.backend.entity.User;
import be.backend.entity.ViewLog;
import be.backend.entity.Watchlist;
import be.backend.enums.UserRole;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.AdminUserMapper;
import be.backend.mapper.ReviewMapper;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.AdminUserDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.dto.WatchlistDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.PageResponse;
import be.backend.repository.PaymentRepository;
import be.backend.repository.ReviewRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.ViewLogRepository;
import be.backend.repository.WatchlistRepository;
import be.backend.services.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

/**
 * Admin User Service Implementation
 * Handles all admin operations related to user management
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;
    private final ViewLogRepository viewLogRepository;
    private final AdminUserMapper adminUserMapper;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> getAllUsers(int page, int size, String search, String role, Boolean isPremium) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<User> userPage = userRepository.findByFilters(search, role, isPremium, pageable);
        
        Page<AdminUserDto> dtoPage = userPage.map(user -> {
            AdminUserDto dto = adminUserMapper.toAdminDto(user);
            enrichUserStats(dto, user);
            return dto;
        });
        
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Integer userId) {
        User user = findUserById(userId);
        
        AdminUserDto userDto = adminUserMapper.toAdminDto(user);
        enrichUserStats(userDto, user);
        
        List<ReviewDto> recentReviews = reviewRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(reviewMapper::toDto)
            .toList();

        List<WatchlistDto> recentWatchlist = watchlistRepository.findByUser_IdOrderByAddedAtDesc(userId, PageRequest.of(0, 10))
            .getContent()
            .stream()
            .map(this::toWatchlistDto)
            .toList();

        List<ViewHistoryDto> recentViews = viewLogRepository.findTop20ByUser_IdOrderByWatchedAtDesc(userId)
            .stream()
            .limit(10)
            .map(this::toViewHistoryDto)
            .toList();

        List<AdminPaymentDto> paymentHistory = paymentRepository.findByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .limit(10)
            .map(this::toAdminPaymentDto)
            .toList();
        
        return new AdminUserDetailResponse(
            userDto,
            recentReviews,
            recentWatchlist,
            recentViews,
            paymentHistory
        );
    }

    @Override
    public AdminUserDto updateUser(Integer userId, AdminUpdateUserRequest request) {
        User user = findUserById(userId);
        
        // Admin can only update fullName and adminNotes
        // Email and age cannot be changed by admin
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getAdminNotes() != null) {
            user.setAdminNotes(request.getAdminNotes());
        }

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                user.setDeletedAt(null);
                user.setBannedAt(null);
                user.setBannedReason(null);
            } else {
                user.setDeletedAt(Instant.now());
            }
        }
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin updated user: {} (fullName, adminNotes and/or isActive)", userId);
        return dto;
    }

    @Override
    public void deleteUser(Integer userId) {
        User user = findUserById(userId);
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        
        log.info("Admin deleted user: {}", userId);
    }

    @Override
    public AdminUserDto changeUserRole(Integer userId, String newRole) {
        User user = findUserById(userId);
        
        try {
            UserRole role = UserRole.fromString(newRole);
            user.setRole(role.getValue());
            User updated = userRepository.save(user);
            
            AdminUserDto dto = adminUserMapper.toAdminDto(updated);
            enrichUserStats(dto, updated);
            
            log.info("Admin changed user {} role to: {}", userId, newRole);
            return dto;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }
    }

    // Grant Premium method removed - Admin cannot manually grant premium
    // Premium is only granted through payment system

    @Override
    public AdminUserDto revokePremium(Integer userId) {
        User user = findUserById(userId);
        
        user.setIsPremium(false);
        user.setPremiumExpiresAt(null);
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin revoked premium from user: {}", userId);
        return dto;
    }

    /**
     * Find user by ID or throw exception
     */
    private User findUserById(Integer userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    /**
     * Enrich user DTO with aggregated statistics
     */
    private void enrichUserStats(AdminUserDto dto, User user) {
        dto.setTotalReviews((long) user.getReviews().size());
        dto.setTotalWatchlist((long) user.getWatchlists().size());
        dto.setTotalViews((long) user.getViewLogs().size());
        dto.setTotalPayments((long) user.getPayments().size());
        
        BigDecimal totalSpent = user.getPayments().stream()
            .filter(p -> "SUCCESS".equals(p.getStatus()))
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalSpent(totalSpent);
        
        dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
    }

    private ViewHistoryDto toViewHistoryDto(ViewLog v) {
        ViewHistoryDto dto = new ViewHistoryDto();
        dto.setId(v.getId());
        dto.setWatchedAt(v.getWatchedAt());
        dto.setWatchDuration(v.getWatchDuration());

        Movie movie = v.getTmdb();
        if (movie != null) {
            dto.setMovieId(movie.getId());
            dto.setMovieTitle(movie.getTitle());
            dto.setPosterPath(movie.getPosterPath());
            dto.setOverview(movie.getOverview());
            dto.setReleaseDate(movie.getReleaseDate());
            dto.setVoteAverage(movie.getVoteAverage());
            dto.setVoteCount(movie.getVoteCount());
        }

        return dto;
    }

    private WatchlistDto toWatchlistDto(Watchlist w) {
        WatchlistDto dto = new WatchlistDto();
        dto.setId(w.getId());
        dto.setAddedAt(w.getAddedAt());
        
        Movie movie = w.getTmdb();
        if (movie != null) {
            dto.setMovieId(movie.getId());
            dto.setMovieTitle(movie.getTitle());
            dto.setPosterPath(movie.getPosterPath());
            dto.setReleaseDate(movie.getReleaseDate());
            dto.setVoteAverage(movie.getVoteAverage());
            dto.setVoteCount(movie.getVoteCount());
        }
        return dto;
    }

    private AdminPaymentDto toAdminPaymentDto(Payment payment) {
        AdminPaymentDto dto = new AdminPaymentDto();
        dto.setPaymentId(payment.getId());
        if (payment.getUser() != null) {
            dto.setUserId(payment.getUser().getId());
            dto.setUserEmail(payment.getUser().getEmail());
            dto.setUserFullName(payment.getUser().getFullName());
        }
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
}
