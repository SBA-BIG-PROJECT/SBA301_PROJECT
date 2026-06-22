package be.backend.controller;

import be.backend.model.dto.AdminUserDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.RefreshTokenRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.AuthResponse;
import be.backend.model.response.MessageResponse;
import be.backend.model.response.PageResponse;
import be.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        URI location = URI.create("/api/v1/users/" + response.getUser().getId());
        return ResponseEntity.created(location).body(response); // 201
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request)); // 200
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken())); // 200
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build(); // 204
    }

    // --- Admin Methods ---

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users")
    public ResponseEntity<PageResponse<AdminUserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isPremium) {
        
        return ResponseEntity.ok(
                authService.getAllUsersAdmin(page, size, search, role, isPremium)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users/{userId}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable Integer userId) {
        return ResponseEntity.ok(authService.getUserDetailAdmin(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{userId}")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        
        return ResponseEntity.ok(authService.updateUserAdmin(userId, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Integer userId) {
        authService.deleteUserAdmin(userId);
        return ResponseEntity.ok(MessageResponse.of("User deleted successfully"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{userId}/role")
    public ResponseEntity<AdminUserDto> changeUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> request) {
        
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
        
        return ResponseEntity.ok(authService.changeUserRoleAdmin(userId, newRole));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/users/{userId}/premium")
    public ResponseEntity<AdminUserDto> revokePremium(@PathVariable Integer userId) {
        return ResponseEntity.ok(authService.revokePremiumAdmin(userId));
    }
}