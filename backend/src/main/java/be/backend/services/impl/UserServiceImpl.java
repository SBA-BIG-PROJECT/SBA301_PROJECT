package be.backend.services.impl;

import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.UserMapper;
import be.backend.model.dto.SubscriptionDto;
import be.backend.model.dto.UserDto;
import be.backend.enums.UserRole;
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
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import be.backend.enums.UserRole;
import be.backend.mapper.AdminUserMapper;
import be.backend.mapper.PaymentMapper;
import be.backend.mapper.ReviewMapper;
import be.backend.mapper.ViewLogMapper;
import be.backend.mapper.WatchlistMapper;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.AdminUserDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.dto.WatchlistDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.PageResponse;
import be.backend.repository.PaymentRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;
    private final ViewLogRepository viewLogRepository;
    private final PaymentRepository paymentRepository;
    private final UserMapper userMapper;
    private final AdminUserMapper adminUserMapper;
    private final ReviewMapper reviewMapper;
    private final WatchlistMapper watchlistMapper;
    private final ViewLogMapper viewLogMapper;
    private final PaymentMapper paymentMapper;
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
                BigDecimal.ZERO
        ).size();
        
        long totalWatchlistItems = watchlistRepository.findByUser_Id(userId).size();
        
        long totalViewedMovies = viewLogRepository.findByUser_Id(userId).size();

        // Calculate average rating
        double averageRating = reviewRepository.findByUser_IdAndRatingGreaterThanEqual(
                userId,
                BigDecimal.ZERO
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

        throw new UnsupportedOperationException(
                "Account deletion is not yet implemented. Please contact support."
        );
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
    public PageResponse<AdminUserDto> getAllUsersAdmin(int page, int size, String search, String role, Boolean isPremium, Boolean isActive) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<User> userPage = userRepository.findByFilters(search, role, isPremium, isActive, pageable);
        
        List<Integer> userIds = userPage.getContent().stream().map(User::getId).toList();
        Map<Integer, Object[]> statsMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<Object[]> batchStats = userRepository.findUserStatsBatch(userIds);
            for (Object[] row : batchStats) {
                statsMap.put((Integer) row[0], row);
            }
        }
        
        Page<AdminUserDto> dtoPage = userPage.map(user -> {
            AdminUserDto dto = adminUserMapper.toAdminDto(user);
            Object[] stats = statsMap.get(user.getId());
            if (stats != null) {
                dto.setTotalReviews(((Number) stats[1]).longValue());
                dto.setTotalWatchlist(((Number) stats[2]).longValue());
                dto.setTotalViews(((Number) stats[3]).longValue());
                dto.setTotalPayments(((Number) stats[4]).longValue());
                dto.setTotalSpent(stats[5] != null ? (BigDecimal) stats[5] : BigDecimal.ZERO);
            } else {
                dto.setTotalReviews(0L);
                dto.setTotalWatchlist(0L);
                dto.setTotalViews(0L);
                dto.setTotalPayments(0L);
                dto.setTotalSpent(BigDecimal.ZERO);
            }
            dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
            return dto;
        });
        
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetailAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        AdminUserDto userDto = adminUserMapper.toAdminDto(user);
        enrichUserStats(userDto, user);
        
        List<ReviewDto> recentReviews = reviewRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(reviewMapper::toDto)
            .toList();

        List<WatchlistDto> recentWatchlist = watchlistRepository.findByUser_IdOrderByAddedAtDesc(userId, PageRequest.of(0, 10))
            .getContent()
            .stream()
            .map(watchlistMapper::toDto)
            .toList();

        List<ViewHistoryDto> recentViews = viewLogRepository.findTop20ByUser_IdOrderByWatchedAtDesc(userId)
            .stream()
            .limit(10)
            .map(viewLogMapper::toDto)
            .toList();

        List<AdminPaymentDto> paymentHistory = paymentRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(paymentMapper::toAdminDto)
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
    @Transactional
    public AdminUserDto updateUserAdmin(Integer userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        if (be.backend.enums.UserRole.ADMIN.getValue().equals(user.getRole())) {
            throw new IllegalStateException("Không thể chỉnh sửa thông tin của quản trị viên khác");
        }
        
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
    @Transactional
    public void deleteUserAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        if (UserRole.ADMIN.getValue().equals(user.getRole())) {
            throw new IllegalStateException("Không thể vô hiệu hóa tài khoản quản trị viên");
        }
        
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        
        log.info("Admin deleted user: {}", userId);
    }

    @Override
    @Transactional
    public AdminUserDto changeUserRoleAdmin(Integer userId, String newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        if (UserRole.ADMIN.getValue().equals(user.getRole())) {
            throw new IllegalStateException("Không thể thay đổi quyền của quản trị viên");
        }
        
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

    @Override
    @Transactional
    public AdminUserDto revokePremiumAdmin(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        if (UserRole.ADMIN.getValue().equals(user.getRole())) {
            throw new IllegalStateException("Không thể thay đổi gói Premium của quản trị viên");
        }
        
        user.setIsPremium(false);
        user.setPremiumExpiresAt(null);
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin revoked premium from user: {}", userId);
        return dto;
    }

    private void enrichUserStats(AdminUserDto dto, User user) {
        List<Object[]> batchStats = userRepository.findUserStatsBatch(List.of(user.getId()));
        if (!batchStats.isEmpty()) {
            Object[] stats = batchStats.get(0);
            dto.setTotalReviews(((Number) stats[1]).longValue());
            dto.setTotalWatchlist(((Number) stats[2]).longValue());
            dto.setTotalViews(((Number) stats[3]).longValue());
            dto.setTotalPayments(((Number) stats[4]).longValue());
            dto.setTotalSpent(stats[5] != null ? (BigDecimal) stats[5] : BigDecimal.ZERO);
        } else {
            dto.setTotalReviews(0L);
            dto.setTotalWatchlist(0L);
            dto.setTotalViews(0L);
            dto.setTotalPayments(0L);
            dto.setTotalSpent(BigDecimal.ZERO);
        }
        
        dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
    }

}
