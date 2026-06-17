package be.backend.services;

import be.backend.entity.RefreshToken;
import be.backend.entity.User;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken verifyAndGet(String token);
    void deleteByToken(String token);
}