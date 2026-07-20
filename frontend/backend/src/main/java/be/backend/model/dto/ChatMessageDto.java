package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ChatMessageDto {

    private String role;

    private String content;

    private Instant sentAt;
}