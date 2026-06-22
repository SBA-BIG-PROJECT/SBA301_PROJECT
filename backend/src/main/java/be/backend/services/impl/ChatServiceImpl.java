package be.backend.services.impl;

import be.backend.document.ChatSessionDocument;
import be.backend.document.ChatMessageDocument;
import be.backend.entity.User;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.ChatMessageDto;
import be.backend.model.dto.ChatSessionDetailDto;
import be.backend.model.dto.ChatSessionDto;
import be.backend.model.request.ChatMessageRequest;
import be.backend.repository.UserRepository;
import be.backend.repository.mongo.ChatMessageRepository;
import be.backend.repository.mongo.ChatSessionRepository;
import be.backend.services.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatClient chatClient;

    private final ChatSessionRepository sessionRepository;

    private final ChatMessageRepository messageRepository;

    private final UserRepository userRepository;

    @Override
    public ChatSessionDto createSession() {

        User user = getCurrentUser();

        ChatSessionDocument session =
                new ChatSessionDocument();

        session.setUserId(user.getId());

        session.setTitle("New Chat");

        session.setStartedAt(Instant.now());

        sessionRepository.save(session);

        ChatSessionDto dto =
                new ChatSessionDto();

        dto.setId(session.getId());
        dto.setTitle(session.getTitle());
        dto.setStartedAt(session.getStartedAt());

        return dto;
    }

    @Override
    public List<ChatSessionDto> getMySessions() {

        User user = getCurrentUser();

        return sessionRepository
                .findByUserIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(session -> {
                    ChatSessionDto dto = new ChatSessionDto();

                    dto.setId(session.getId());
                    dto.setTitle(session.getTitle());
                    dto.setStartedAt(session.getStartedAt());

                    return dto;
                })
                .toList();
    }

    @Override
    public ChatSessionDetailDto getSession(String sessionId) {

        User user = getCurrentUser();

        ChatSessionDocument session =
                sessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Không tìm thấy session"
                                )
                        );

        if (!session.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Bạn không có quyền truy cập session này"
            );
        }

        List<ChatMessageDto> messages =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(sessionId)
                        .stream()
                        .map(message -> {

                            ChatMessageDto dto = new ChatMessageDto();

                            dto.setRole(message.getRole());
                            dto.setContent(message.getContent());
                            dto.setSentAt(message.getSentAt());

                            return dto;
                        })
                        .toList();

        ChatSessionDetailDto dto =
                new ChatSessionDetailDto();

        dto.setSessionId(sessionId);
        dto.setMessages(messages);

        return dto;
    }

    @Override
    public ChatMessageDto sendMessage(
            String sessionId,
            ChatMessageRequest request) {

        ChatSessionDocument session =
                getSessionOwnedByCurrentUser(sessionId);

        // Đặt title từ câu hỏi đầu tiên
        if ("New Chat".equals(session.getTitle())) {

            String title = request.getMessage();

            if (title.length() > 40) {
                title = title.substring(0, 40);
            }

            session.setTitle(title);

            sessionRepository.save(session);
        }

        // Lưu message của user
        ChatMessageDocument userMessage =
                new ChatMessageDocument();

        userMessage.setSessionId(sessionId);
        userMessage.setRole("USER");
        userMessage.setContent(request.getMessage());
        userMessage.setSentAt(Instant.now());

        messageRepository.save(userMessage);

        // Lấy lịch sử chat
        List<ChatMessageDocument> history =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(
                                sessionId
                        );

        StringBuilder conversation =
                new StringBuilder();

        for (ChatMessageDocument msg : history) {

            conversation.append(msg.getRole())
                    .append(": ")
                    .append(msg.getContent())
                    .append("\n");
        }

        String aiResponse =
                chatClient.prompt()
                        .system("""
                            You are a movie recommendation assistant.

                            Responsibilities:
                            - Recommend movies.
                            - Explain movie plots without spoilers.
                            - Compare movies, actors, directors and genres.
                            - Suggest trending movies.
                            - Answer in Vietnamese unless requested otherwise.
                            - Keep answers concise and useful.
                            """)
                        .user(conversation.toString())
                        .call()
                        .content();

        // Lưu phản hồi AI
        ChatMessageDocument assistantMessage =
                new ChatMessageDocument();

        assistantMessage.setSessionId(sessionId);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(aiResponse);
        assistantMessage.setSentAt(Instant.now());

        messageRepository.save(assistantMessage);

        ChatMessageDto dto =
                new ChatMessageDto();

        dto.setRole("ASSISTANT");
        dto.setContent(aiResponse);
        dto.setSentAt(assistantMessage.getSentAt());

        return dto;
    }

    @Override
    public void deleteSession(String sessionId) {

        User user = getCurrentUser();

        ChatSessionDocument session =
                sessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Không tìm thấy session"
                                )
                        );

        if (!session.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Bạn không có quyền xóa session này"
            );
        }

        List<ChatMessageDocument> messages =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(sessionId);

        messageRepository.deleteAll(messages);

        sessionRepository.delete(session);
    }

    // ---- helpers ----
    private ChatSessionDocument getSessionOwnedByCurrentUser(
            String sessionId) {

        User user = getCurrentUser();

        ChatSessionDocument session =
                sessionRepository.findById(sessionId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Không tìm thấy session"
                                ));

        if (!session.getUserId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Bạn không có quyền truy cập session này"
            );
        }

        return session;
    }

    private User getCurrentUser() {

        var authentication = SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null) {
            throw new ResourceNotFoundException(
                    "User chưa đăng nhập"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy user: " + email
                        )
                );
    }
}
