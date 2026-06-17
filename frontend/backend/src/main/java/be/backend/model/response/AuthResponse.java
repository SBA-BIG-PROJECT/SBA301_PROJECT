package be.backend.model.response;

import be.backend.model.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;          // access token
    private String refreshToken;
    private String tokenType;      // "Bearer"
    private long expiresIn;        // giây
    private UserDto user;
}