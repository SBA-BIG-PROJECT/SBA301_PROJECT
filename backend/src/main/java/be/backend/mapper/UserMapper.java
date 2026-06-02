package be.backend.mapper;

import be.backend.entity.User;
import be.backend.model.dto.UserDto;
import be.backend.model.request.RegisterRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDto toDto(User user);

    // password/role/etc. are set in the service, not mapped from the request
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isPremium", ignore = true)
    @Mapping(target = "premiumExpiresAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "chatSessions", ignore = true)
    @Mapping(target = "movies", ignore = true)
    @Mapping(target = "notifications", ignore = true)
    @Mapping(target = "payments", ignore = true)
    @Mapping(target = "recommendations", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "viewLogs", ignore = true)
    @Mapping(target = "watchlists", ignore = true)
    User toEntity(RegisterRequest request);
}