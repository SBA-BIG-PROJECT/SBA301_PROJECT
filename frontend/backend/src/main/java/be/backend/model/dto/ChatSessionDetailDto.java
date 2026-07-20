package be.backend.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatSessionDetailDto {

    private String sessionId;

    private List<ChatMessageDto> messages;
}
