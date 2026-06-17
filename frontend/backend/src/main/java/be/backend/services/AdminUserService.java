package be.backend.services;

import be.backend.model.dto.AdminUserDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.PageResponse;

public interface AdminUserService {
    
    /**
     * Get all users with pagination and filters
     */
    PageResponse<AdminUserDto> getAllUsers(
            int page, 
            int size, 
            String search, 
            String role, 
            Boolean isPremium
    );
    
    /**
     * Get user detail with activity summary
     */
    AdminUserDetailResponse getUserDetail(Integer userId);
    
    /**
     * Update user information
     */
    AdminUserDto updateUser(Integer userId, AdminUpdateUserRequest request);
    
    /**
     * Delete user (soft delete)
     */
    void deleteUser(Integer userId);
    
    /**
     * Change user role
     */
    AdminUserDto changeUserRole(Integer userId, String newRole);
    
    /**
     * Revoke premium access from user
     */
    AdminUserDto revokePremium(Integer userId);
}
