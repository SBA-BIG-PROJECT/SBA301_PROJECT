package be.backend.services;

import be.backend.model.dto.ChatMessageDto;
import be.backend.model.dto.ChatSessionDetailDto;
import be.backend.model.dto.ChatSessionDto;
import be.backend.model.request.ChatMessageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ChatService {

    ChatSessionDto createSession();

    List<ChatSessionDto> getMySessions();

    ChatSessionDetailDto getSession(String sessionId);

    ChatMessageDto sendMessage(String sessionId, ChatMessageRequest request);

    void deleteSession(String sessionId);
}