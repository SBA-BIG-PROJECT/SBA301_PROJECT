package be.backend.controller;

import be.backend.model.dto.AdminUserDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.MessageResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<PageResponse<AdminUserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isPremium) {
        
        return ResponseEntity.ok(
                userService.getAllUsersAdmin(page, size, search, role, isPremium)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable Integer userId) {
        return ResponseEntity.ok(userService.getUserDetailAdmin(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        
        return ResponseEntity.ok(userService.updateUserAdmin(userId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Integer userId) {
        userService.deleteUserAdmin(userId);
        return ResponseEntity.ok(MessageResponse.of("User deleted successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/role")
    public ResponseEntity<AdminUserDto> changeUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> request) {
        
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        
        return ResponseEntity.ok(userService.changeUserRoleAdmin(userId, newRole));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}/premium")
    public ResponseEntity<AdminUserDto> revokePremium(@PathVariable Integer userId) {
        return ResponseEntity.ok(userService.revokePremiumAdmin(userId));
    }
}
