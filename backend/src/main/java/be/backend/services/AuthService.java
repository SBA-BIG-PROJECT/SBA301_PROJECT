package be.backend.services;

import be.backend.model.dto.AdminUserDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.AuthResponse;
import be.backend.model.response.PageResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);

    // --- Admin Methods ---
    PageResponse<AdminUserDto> getAllUsersAdmin(int page, int size, String search, String role, Boolean isPremium);
    AdminUserDetailResponse getUserDetailAdmin(Integer userId);
    AdminUserDto updateUserAdmin(Integer userId, AdminUpdateUserRequest request);
    void deleteUserAdmin(Integer userId);
    AdminUserDto changeUserRoleAdmin(Integer userId, String newRole);
    AdminUserDto revokePremiumAdmin(Integer userId);
}