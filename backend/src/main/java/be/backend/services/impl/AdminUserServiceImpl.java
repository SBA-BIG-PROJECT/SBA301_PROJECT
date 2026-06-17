package be.backend.services.impl;

import be.backend.entity.User;
import be.backend.enums.UserRole;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.AdminUserMapper;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.AdminUserDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.dto.ViewHistoryDto;
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

import java.time.Instant;
import java.util.Collections;

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
        
        // Get recent activities (limit to 10 each)
        // Note: You'll need to implement these methods in respective repositories
        
        return new AdminUserDetailResponse(
            userDto,
            Collections.emptyList(), // recentReviews - implement if needed
            Collections.emptyList(), // recentWatchlist - implement if needed
            Collections.emptyList(), // recentViews - implement if needed
            Collections.emptyList()  // paymentHistory - implement if needed
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
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin updated user: {} (fullName and/or adminNotes)", userId);
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
        dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
    }
}
