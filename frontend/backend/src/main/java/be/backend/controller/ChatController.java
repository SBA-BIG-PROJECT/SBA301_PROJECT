package be.backend.controller;

import be.backend.model.dto.ChatMessageDto;
import be.backend.model.dto.ChatSessionDetailDto;
import be.backend.model.dto.ChatSessionDto;
import be.backend.model.request.ChatMessageRequest;
import be.backend.services.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatSessionDto createSession() {

        return chatService.createSession();
    }

    @GetMapping("/sessions")
    public List<ChatSessionDto> getSessions() {

        return chatService.getMySessions();
    }

    @GetMapping("/sessions/{id}")
    public ChatSessionDetailDto getSession(
            @PathVariable String id) {

        return chatService.getSession(id);
    }

    @PostMapping("/sessions/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageDto sendMessage(
            @PathVariable String id,
            @Valid @RequestBody ChatMessageRequest request) {

        return chatService.sendMessage(id, request);
    }

    @DeleteMapping("/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSession(
            @PathVariable String id) {

        chatService.deleteSession(id);
    }
}