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
import be.backend.services.CloudinaryService;
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
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

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
                    cloudinaryService.deleteImage(user.getAvatarPublicId());
                    log.info("Deleted old avatar for user: {}", email);
                } catch (IOException e) {
                    log.warn("Failed to delete old avatar, continuing with upload: {}", e.getMessage());
                    // Continue with upload even if delete fails
                }
            }

            // Upload new avatar
            Map<String, String> uploadResult = cloudinaryService.uploadImage(file, "movie-app/avatars");
            
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
            cloudinaryService.deleteImage(user.getAvatarPublicId());
            
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
}
