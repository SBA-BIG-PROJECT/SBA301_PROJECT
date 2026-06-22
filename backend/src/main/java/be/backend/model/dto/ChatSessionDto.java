package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ChatSessionDto {
    private String id;
    private String title;
    private Instant startedAt;
}