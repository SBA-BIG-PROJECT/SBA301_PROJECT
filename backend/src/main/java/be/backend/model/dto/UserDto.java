package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class UserDto {
    private Integer id;
    private String email;
    private String fullName;
    private Integer age;
    private String avatarUrl;
    private String role;
    private Boolean isPremium;
    private Instant premiumExpiresAt;
    private Instant createdAt;
}