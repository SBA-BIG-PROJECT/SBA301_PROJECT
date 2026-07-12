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
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatClient chatClient;

    private final ChatMemory chatMemory;

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

        if (request == null
                || request.getMessage() == null
                || request.getMessage().isBlank()) {

            throw new IllegalArgumentException(
                    "Tin nhắn không được để trống"
            );
        }

        String userContent =
                request.getMessage().trim();

        /*
         * Đặt title từ câu hỏi đầu tiên.
         */
        if ("New Chat".equals(session.getTitle())) {

            String title = userContent;

            if (title.length() > 40) {
                title = title.substring(0, 40);
            }

            session.setTitle(title);
            sessionRepository.save(session);
        }

        /*
         * Không tự lưu user message tại đây.
         *
         * MessageChatMemoryAdvisor sẽ gọi:
         * MongoChatMemory.add(...)
         */
        String aiResponse =
                chatClient.prompt()
                        .user(userContent)
                        .advisors(advisorSpec ->
                                advisorSpec.param(
                                        ChatMemory.CONVERSATION_ID,
                                        sessionId
                                )
                        )
                        .call()
                        .content();

        if (aiResponse == null
                || aiResponse.isBlank()) {

            aiResponse =
                    "Xin lỗi, tôi chưa thể tạo phản hồi lúc này.";

            /*
             * Trường hợp model trả rỗng, advisor có thể
             * không lưu được assistant response.
             */
            chatMemory.add(
                    sessionId,
                    new AssistantMessage(aiResponse)
            );
        }

        ChatMessageDto dto =
                new ChatMessageDto();

        dto.setRole("ASSISTANT");
        dto.setContent(aiResponse);
        dto.setSentAt(Instant.now());

        return dto;
    }

    @Override
    public void deleteSession(
            String sessionId) {

        User user =
                getCurrentUser();

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

        /*
         * MongoChatMemory.clear() xóa toàn bộ message
         * thuộc session trong MongoDB.
         */
        chatMemory.clear(sessionId);

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
