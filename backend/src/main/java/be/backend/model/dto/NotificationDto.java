package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class NotificationDto {

    private Integer id;

    private String message;

    private Boolean isRead;

    private Instant createdAt;
}

