package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ReviewDto {
    private Integer id;
    private BigDecimal rating;
    private String comment;
    private Instant createdAt;
    private Integer userId;
    private String userName;
    private String userAvatar;
    private Integer movieId;
    private String movieTitle;
}