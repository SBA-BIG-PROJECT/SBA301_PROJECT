package be.backend.services.impl;

import be.backend.entity.RefreshToken;
import be.backend.entity.User;
import be.backend.exception.EmailAlreadyExistsException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.UserMapper;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.AuthResponse;
import be.backend.repository.UserRepository;
import be.backend.services.AuthService;
import be.backend.services.JwtService;
import be.backend.services.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenService refreshTokenService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email đã được sử dụng");
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");  // Default role is USER
        user.setIsPremium(false);
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        return buildTokens(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        return buildTokens(user);
    }

    @Override
    public AuthResponse refresh(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.verifyAndGet(refreshTokenStr);
        User user = refreshToken.getUser();

        var userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMillis() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    public void logout(String refreshTokenStr) {
        refreshTokenService.deleteByToken(refreshTokenStr);
    }

    private AuthResponse buildTokens(User user) {
        var userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMillis() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }
}