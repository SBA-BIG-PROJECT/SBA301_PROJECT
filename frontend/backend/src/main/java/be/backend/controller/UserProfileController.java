package be.backend.controller;

import be.backend.model.dto.SubscriptionDto;
import be.backend.model.dto.UserDto;
import be.backend.model.dto.UserStatsDto;
import be.backend.model.request.ChangePasswordRequest;
import be.backend.model.request.DeleteAccountRequest;
import be.backend.model.request.UpdateProfileRequest;
import be.backend.model.response.MessageResponse;
import be.backend.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    /**
     * Get current user profile
     * GET /api/v1/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUserProfile(Authentication authentication) {
        String email = extractEmail(authentication);
        UserDto profile = userService.getCurrentUserProfile(email);
        return ResponseEntity.ok(profile);
    }

    /**
     * Update current user profile
     * PUT /api/v1/users/me
     */
    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        UserDto updatedProfile = userService.updateProfile(email, request);
        return ResponseEntity.ok(updatedProfile);
    }

    /**
     * Change password
     * PUT /api/v1/users/me/password
     */
    @PutMapping("/me/password")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        userService.changePassword(email, request);
        return ResponseEntity.ok(MessageResponse.of("Password changed successfully"));
    }

    /**
     * Get subscription information
     * GET /api/v1/users/me/subscription
     */
    @GetMapping("/me/subscription")
    public ResponseEntity<SubscriptionDto> getSubscription(Authentication authentication) {
        String email = extractEmail(authentication);
        SubscriptionDto subscription = userService.getSubscription(email);
        return ResponseEntity.ok(subscription);
    }

    /**
     * Get user statistics
     * GET /api/v1/users/me/stats
     */
    @GetMapping("/me/stats")
    public ResponseEntity<UserStatsDto> getUserStats(Authentication authentication) {
        String email = extractEmail(authentication);
        UserStatsDto stats = userService.getUserStats(email);
        return ResponseEntity.ok(stats);
    }

    /**
     * Delete account (soft delete)
     * DELETE /api/v1/users/me
     */
    @DeleteMapping("/me")
    public ResponseEntity<MessageResponse> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request,
            Authentication authentication) {
        String email = extractEmail(authentication);
        userService.deleteAccount(email, request);
        return ResponseEntity.ok(MessageResponse.of("Account deleted successfully"));
    }

    /**
     * Upload avatar
     * POST /api/v1/users/me/avatar
     */
    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<UserDto> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication authentication) {
        String email = extractEmail(authentication);
        UserDto updatedProfile = userService.uploadAvatar(email, file);
        return ResponseEntity.ok(updatedProfile);
    }

    /**
     * Delete avatar
     * DELETE /api/v1/users/me/avatar
     */
    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserDto> deleteAvatar(Authentication authentication) {
        String email = extractEmail(authentication);
        UserDto updatedProfile = userService.deleteAvatar(email);
        return ResponseEntity.ok(updatedProfile);
    }

    /**
     * Helper method to extract email from Authentication
     */
    private String extractEmail(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            return userDetails.getUsername(); // In our case, username is email
        }
        throw new IllegalStateException("User not authenticated");
    }
}
