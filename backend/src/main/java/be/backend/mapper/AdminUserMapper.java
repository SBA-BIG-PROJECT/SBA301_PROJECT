package be.backend.mapper;

import be.backend.entity.User;
import be.backend.model.dto.AdminUserDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AdminUserMapper {
    
    @Mapping(target = "totalReviews", ignore = true)
    @Mapping(target = "totalWatchlist", ignore = true)
    @Mapping(target = "totalViews", ignore = true)
    @Mapping(target = "totalPayments", ignore = true)
    @Mapping(target = "lastLoginAt", source = "lastLoginAt")
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "deletedAt", source = "deletedAt")
    @Mapping(target = "bannedAt", source = "bannedAt")
    @Mapping(target = "bannedReason", source = "bannedReason")
    @Mapping(target = "adminNotes", source = "adminNotes")
    AdminUserDto toAdminDto(User user);
}
