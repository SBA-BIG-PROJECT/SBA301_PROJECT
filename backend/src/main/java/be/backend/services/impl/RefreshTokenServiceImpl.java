package be.backend.services.impl;

import be.backend.entity.RefreshToken;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.repository.RefreshTokenRepository;
import be.backend.services.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository repository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(Instant.now().plusMillis(refreshExpiration));
        return repository.save(token);
    }

    @Override
    @Transactional
    public RefreshToken verifyAndGet(String token) {
        RefreshToken refreshToken = repository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token không hợp lệ"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            repository.delete(refreshToken);
            throw new ResourceNotFoundException("Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }
        return refreshToken;
    }

    @Override
    @Transactional
    public void deleteByToken(String token) {
        repository.deleteByToken(token);
    }
}