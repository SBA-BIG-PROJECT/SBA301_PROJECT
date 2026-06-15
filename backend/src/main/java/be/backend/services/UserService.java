package be.backend.services;

import be.backend.model.dto.SubscriptionDto;
import be.backend.model.dto.UserDto;
import be.backend.model.dto.UserStatsDto;
import be.backend.model.request.ChangePasswordRequest;
import be.backend.model.request.DeleteAccountRequest;
import be.backend.model.request.UpdateProfileRequest;

public interface UserService {
    
    /**
     * Get current user profile
     * @param email user email from JWT token
     * @return user profile information
     */
    UserDto getCurrentUserProfile(String email);
    
    /**
     * Update current user profile (fullName, age)
     * @param email user email from JWT token
     * @param request update data
     * @return updated user profile
     */
    UserDto updateProfile(String email, UpdateProfileRequest request);
    
    /**
     * Change user password
     * @param email user email from JWT token
     * @param request password change data
     */
    void changePassword(String email, ChangePasswordRequest request);
    
    /**
     * Get subscription information
     * @param email user email from JWT token
     * @return subscription details
     */
    SubscriptionDto getSubscription(String email);
    
    /**
     * Get user statistics
     * @param email user email from JWT token
     * @return user activity stats
     */
    UserStatsDto getUserStats(String email);
    
    /**
     * Delete user account (soft delete)
     * @param email user email from JWT token
     * @param request delete account data with password confirmation
     */
    void deleteAccount(String email, DeleteAccountRequest request);
    
    /**
     * Upload user avatar
     * @param email user email from JWT token
     * @param file avatar image file
     * @return updated user profile with new avatar URL
     */
    UserDto uploadAvatar(String email, org.springframework.web.multipart.MultipartFile file);
    
    /**
     * Delete user avatar
     * @param email user email from JWT token
     * @return updated user profile without avatar
     */
    UserDto deleteAvatar(String email);
}
