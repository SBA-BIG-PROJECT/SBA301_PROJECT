package be.backend.mapper;

import be.backend.entity.Review;
import be.backend.model.dto.ReviewDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.fullName", target = "userName")
    @Mapping(source = "user.avatarUrl", target = "userAvatar")
    @Mapping(source = "tmdb.id", target = "movieId")
    @Mapping(source = "tmdb.title", target = "movieTitle")
    ReviewDto toDto(Review review);
}
