package be.backend.controller;

import be.backend.model.dto.AdminUserDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.MessageResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin User Management Controller
 * Handles all admin operations related to user management
 * 
 * Authorization: Requires ADMIN role
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * Get all users with pagination and filters
     * GET /api/v1/admin/users?page=0&size=20&search=john&role=USER&isPremium=true
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminUserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isPremium) {
        
        return ResponseEntity.ok(
                adminUserService.getAllUsers(page, size, search, role, isPremium)
        );
    }

    /**
     * Get user detail with full activity
     * GET /api/v1/admin/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable Integer userId) {
        return ResponseEntity.ok(adminUserService.getUserDetail(userId));
    }

    /**
     * Update user information
     * PUT /api/v1/admin/users/{userId}
     */
    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        
        return ResponseEntity.ok(adminUserService.updateUser(userId, request));
    }

    /**
     * Delete user (soft delete)
     * DELETE /api/v1/admin/users/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Integer userId) {
        adminUserService.deleteUser(userId);
        return ResponseEntity.ok(MessageResponse.of("User deleted successfully"));
    }

    /**
     * Change user role
     * PUT /api/v1/admin/users/{userId}/role
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<AdminUserDto> changeUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> request) {
        
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        
        return ResponseEntity.ok(adminUserService.changeUserRole(userId, newRole));
    }

    /**
     * Revoke premium access from user
     * DELETE /api/v1/admin/users/{userId}/premium
     */
    @DeleteMapping("/{userId}/premium")
    public ResponseEntity<AdminUserDto> revokePremium(@PathVariable Integer userId) {
        return ResponseEntity.ok(adminUserService.revokePremium(userId));
    }
}
