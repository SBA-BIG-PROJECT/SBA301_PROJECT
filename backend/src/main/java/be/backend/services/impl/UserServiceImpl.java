package be.backend.services.impl;

import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.UserMapper;
import be.backend.model.dto.SubscriptionDto;
import be.backend.model.dto.UserDto;
import be.backend.model.dto.UserStatsDto;
import be.backend.model.request.ChangePasswordRequest;
import be.backend.model.request.DeleteAccountRequest;
import be.backend.model.request.UpdateProfileRequest;
import be.backend.repository.ReviewRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.ViewLogRepository;
import be.backend.repository.WatchlistRepository;
import be.backend.services.FileStorageService;
import be.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;
    private final ViewLogRepository viewLogRepository;
    private final be.backend.repository.PaymentRepository paymentRepository;
    private final UserMapper userMapper;
    private final be.backend.mapper.AdminUserMapper adminUserMapper;
    private final be.backend.mapper.ReviewMapper reviewMapper;
    private final be.backend.mapper.WatchlistMapper watchlistMapper;
    private final be.backend.mapper.ViewLogMapper viewLogMapper;
    private final be.backend.mapper.PaymentMapper paymentMapper;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUserProfile(String email) {
        User user = findUserByEmail(email);
        return userMapper.toDto(user);
    }

    @Override
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = findUserByEmail(email);

        // Update only provided fields
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getAge() != null) {
            user.setAge(request.getAge());
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toDto(updatedUser);
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByEmail(email);

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Check if new password is same as current
        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionDto getSubscription(String email) {
        User user = findUserByEmail(email);

        Long daysRemaining = 0L;
        if (user.getIsPremium() && user.getPremiumExpiresAt() != null) {
            Instant now = Instant.now();
            if (user.getPremiumExpiresAt().isAfter(now)) {
                daysRemaining = Duration.between(now, user.getPremiumExpiresAt()).toDays();
            }
        }

        return new SubscriptionDto(
                user.getIsPremium(),
                user.getPremiumExpiresAt(),
                daysRemaining,
                false // autoRenew not implemented yet
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserStatsDto getUserStats(String email) {
        User user = findUserByEmail(email);
        Integer userId = user.getId();

        // Count statistics from repositories
        long totalReviews = reviewRepository.findByUser_IdAndRatingGreaterThanEqual(
                userId, 
                java.math.BigDecimal.ZERO
        ).size();
        
        long totalWatchlistItems = watchlistRepository.findByUser_Id(userId).size();
        
        long totalViewedMovies = viewLogRepository.findByUser_Id(userId).size();

        // Calculate average rating
        double averageRating = reviewRepository.findByUser_IdAndRatingGreaterThanEqual(
                userId,
                java.math.BigDecimal.ZERO
        ).stream()
                .mapToDouble(review -> review.getRating().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate account age in days
        long accountAgeDays = Duration.between(user.getCreatedAt(), Instant.now()).toDays();

        return new UserStatsDto(
                totalReviews,
                totalWatchlistItems,
                totalViewedMovies,
                Math.round(averageRating * 10.0) / 10.0, // Round to 1 decimal
                accountAgeDays
        );
    }

    @Override
    public void deleteAccount(String email, DeleteAccountRequest request) {
        User user = findUserByEmail(email);

        // Verify password before deletion
        if (!passwordEncoder.matches(request.getConfirmPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Password confirmation is incorrect");
        }

        // TODO: Implement soft delete
        // For now, we'll just throw an exception
        // In production, you should:
        // 1. Add deletedAt field to User entity
        // 2. Set deletedAt = Instant.now()
        // 3. Update UserDetailsService to exclude deleted users
        // 4. Schedule a job to hard delete after 30 days
        
        throw new UnsupportedOperationException(
                "Account deletion is not yet implemented. Please contact support."
        );
        
        // Future implementation:
        // user.setDeletedAt(Instant.now());
        // user.setIsActive(false);
        // userRepository.save(user);
        
        // Optional: Log deletion reason for analytics
        // if (request.getReason() != null) {
        //     auditLogService.logAccountDeletion(user.getId(), request.getReason());
        // }
    }

    @Override
    public UserDto uploadAvatar(String email, MultipartFile file) {
        User user = findUserByEmail(email);

        try {
            // Delete old avatar if exists
            if (user.getAvatarPublicId() != null && !user.getAvatarPublicId().isEmpty()) {
                try {
                    fileStorageService.deleteImage(user.getAvatarPublicId());
                    log.info("Deleted old avatar for user: {}", email);
                } catch (IOException e) {
                    log.warn("Failed to delete old avatar, continuing with upload: {}", e.getMessage());
                    // Continue with upload even if delete fails
                }
            }

            // Upload new avatar
            Map<String, String> uploadResult = fileStorageService.uploadImage(file, "movie-app/avatars");
            
            // Update user avatar fields
            user.setAvatarUrl(uploadResult.get("url"));
            user.setAvatarPublicId(uploadResult.get("public_id"));
            
            User updatedUser = userRepository.save(user);
            log.info("Avatar uploaded successfully for user: {}", email);
            
            return userMapper.toDto(updatedUser);

        } catch (IOException e) {
            log.error("Failed to upload avatar for user: {}", email, e);
            throw new RuntimeException("Failed to upload avatar: " + e.getMessage(), e);
        } catch (IllegalArgumentException e) {
            log.error("Invalid avatar file for user: {}", email, e);
            throw e;
        }
    }

    @Override
    public UserDto deleteAvatar(String email) {
        User user = findUserByEmail(email);

        // Check if user has avatar
        if (user.getAvatarPublicId() == null || user.getAvatarPublicId().isEmpty()) {
            throw new IllegalArgumentException("User does not have an avatar");
        }

        try {
            // Delete from Cloudinary
            fileStorageService.deleteImage(user.getAvatarPublicId());
            
            // Clear avatar fields
            user.setAvatarUrl(null);
            user.setAvatarPublicId(null);
            
            User updatedUser = userRepository.save(user);
            log.info("Avatar deleted successfully for user: {}", email);
            
            return userMapper.toDto(updatedUser);

        } catch (IOException e) {
            log.error("Failed to delete avatar for user: {}", email, e);
            throw new RuntimeException("Failed to delete avatar: " + e.getMessage(), e);
        }
    }

    /**
     * Helper method to find user by email
     * @param email user email
     * @return User entity
     * @throws ResourceNotFoundException if user not found
     */
    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    // --- Admin Methods ---

    @Override
    @Transactional(readOnly = true)
    public be.backend.model.response.PageResponse<be.backend.model.dto.AdminUserDto> getAllUsersAdmin(int page, int size, String search, String role, Boolean isPremium) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        
        org.springframework.data.domain.Page<User> userPage = userRepository.findByFilters(search, role, isPremium, pageable);
        
        java.util.List<Integer> userIds = userPage.getContent().stream().map(User::getId).toList();
        java.util.Map<Integer, Object[]> statsMap = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            java.util.List<Object[]> batchStats = userRepository.findUserStatsBatch(userIds);
            for (Object[] row : batchStats) {
                statsMap.put((Integer) row[0], row);
            }
        }
        
        org.springframework.data.domain.Page<be.backend.model.dto.AdminUserDto> dtoPage = userPage.map(user -> {
            be.backend.model.dto.AdminUserDto dto = adminUserMapper.toAdminDto(user);
            Object[] stats = statsMap.get(user.getId());
            if (stats != null) {
                dto.setTotalReviews(((Number) stats[1]).longValue());
                dto.setTotalWatchlist(((Number) stats[2]).longValue());
                dto.setTotalViews(((Number) stats[3]).longValue());
                dto.setTotalPayments(((Number) stats[4]).longValue());
                dto.setTotalSpent(stats[5] != null ? (java.math.BigDecimal) stats[5] : java.math.BigDecimal.ZERO);
            } else {
                dto.setTotalReviews(0L);
                dto.setTotalWatchlist(0L);
                dto.setTotalViews(0L);
                dto.setTotalPayments(0L);
                dto.setTotalSpent(java.math.BigDecimal.ZERO);
            }
            dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
            return dto;
        });
        
        return be.backend.model.response.PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public be.backend.model.response.AdminUserDetailResponse getUserDetailAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        be.backend.model.dto.AdminUserDto userDto = adminUserMapper.toAdminDto(user);
        enrichUserStats(userDto, user);
        
        java.util.List<be.backend.model.dto.ReviewDto> recentReviews = reviewRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(reviewMapper::toDto)
            .toList();

        java.util.List<be.backend.model.dto.WatchlistDto> recentWatchlist = watchlistRepository.findByUser_IdOrderByAddedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, 10))
            .getContent()
            .stream()
            .map(watchlistMapper::toDto)
            .toList();

        java.util.List<be.backend.model.dto.ViewHistoryDto> recentViews = viewLogRepository.findTop20ByUser_IdOrderByWatchedAtDesc(userId)
            .stream()
            .limit(10)
            .map(viewLogMapper::toDto)
            .toList();

        java.util.List<be.backend.model.dto.AdminPaymentDto> paymentHistory = paymentRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(paymentMapper::toAdminDto)
            .toList();
        
        return new be.backend.model.response.AdminUserDetailResponse(
            userDto,
            recentReviews,
            recentWatchlist,
            recentViews,
            paymentHistory
        );
    }

    @Override
    @Transactional
    public be.backend.model.dto.AdminUserDto updateUserAdmin(Integer userId, be.backend.model.request.AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
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
        be.backend.model.dto.AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin updated user: {} (fullName, adminNotes and/or isActive)", userId);
        return dto;
    }

    @Override
    @Transactional
    public void deleteUserAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        
        log.info("Admin deleted user: {}", userId);
    }

    @Override
    @Transactional
    public be.backend.model.dto.AdminUserDto changeUserRoleAdmin(Integer userId, String newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        try {
            be.backend.enums.UserRole role = be.backend.enums.UserRole.fromString(newRole);
            user.setRole(role.getValue());
            User updated = userRepository.save(user);
            
            be.backend.model.dto.AdminUserDto dto = adminUserMapper.toAdminDto(updated);
            enrichUserStats(dto, updated);
            
            log.info("Admin changed user {} role to: {}", userId, newRole);
            return dto;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }
    }

    @Override
    @Transactional
    public be.backend.model.dto.AdminUserDto revokePremiumAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        user.setIsPremium(false);
        user.setPremiumExpiresAt(null);
        
        User updated = userRepository.save(user);
        be.backend.model.dto.AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin revoked premium from user: {}", userId);
        return dto;
    }

    private void enrichUserStats(be.backend.model.dto.AdminUserDto dto, User user) {
        java.util.List<Object[]> batchStats = userRepository.findUserStatsBatch(java.util.List.of(user.getId()));
        if (!batchStats.isEmpty()) {
            Object[] stats = batchStats.get(0);
            dto.setTotalReviews(((Number) stats[1]).longValue());
            dto.setTotalWatchlist(((Number) stats[2]).longValue());
            dto.setTotalViews(((Number) stats[3]).longValue());
            dto.setTotalPayments(((Number) stats[4]).longValue());
            dto.setTotalSpent(stats[5] != null ? (java.math.BigDecimal) stats[5] : java.math.BigDecimal.ZERO);
        } else {
            dto.setTotalReviews(0L);
            dto.setTotalWatchlist(0L);
            dto.setTotalViews(0L);
            dto.setTotalPayments(0L);
            dto.setTotalSpent(java.math.BigDecimal.ZERO);
        }
        
        dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
    }

}
