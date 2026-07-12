package be.backend.configuration;

import be.backend.document.ChatMessageDocument;
import be.backend.repository.mongo.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class MongoChatMemory implements ChatMemory {

    /*
     * Số message gần nhất được gửi vào AI.
     *
     * MongoDB vẫn giữ toàn bộ lịch sử.
     */
    private static final int MAX_MEMORY_MESSAGES = 20;

    private final ChatMessageRepository messageRepository;

    /*
     * =========================================================
     * ADD
     * =========================================================
     */

    @Override
    public void add(
            String conversationId,
            List<Message> messages) {

        validateConversationId(conversationId);

        if (messages == null || messages.isEmpty()) {
            return;
        }

        for (Message message : messages) {

            if (message == null) {
                continue;
            }

            saveMessage(
                    conversationId,
                    message
            );
        }
    }

    /*
     * =========================================================
     * GET
     * =========================================================
     */

    @Override
    public List<Message> get(
            String conversationId) {

        validateConversationId(conversationId);

        List<ChatMessageDocument> documents =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(
                                conversationId
                        );

        if (documents.isEmpty()) {
            return List.of();
        }

        int fromIndex =
                Math.max(
                        0,
                        documents.size() - MAX_MEMORY_MESSAGES
                );

        List<Message> messages =
                new ArrayList<>();

        for (int index = fromIndex;
             index < documents.size();
             index++) {

            ChatMessageDocument document =
                    documents.get(index);

            Message message =
                    toSpringAiMessage(document);

            if (message != null) {
                messages.add(message);
            }
        }

        return messages;
    }

    /*
     * =========================================================
     * CLEAR
     * =========================================================
     */

    @Override
    public void clear(
            String conversationId) {

        validateConversationId(conversationId);

        List<ChatMessageDocument> messages =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(
                                conversationId
                        );

        if (!messages.isEmpty()) {
            messageRepository.deleteAll(messages);
        }
    }

    /*
     * =========================================================
     * SAVE MESSAGE
     * =========================================================
     */

    private void saveMessage(
            String conversationId,
            Message message) {

        String role =
                toStoredRole(
                        message.getMessageType()
                );

        /*
         * Collection hiện tại chỉ phục vụ lịch sử
         * USER và ASSISTANT.
         *
         * Không lưu SYSTEM hoặc TOOL message.
         */
        if (role == null) {
            return;
        }

        String content =
                message.getText();

        if (content == null || content.isBlank()) {
            return;
        }

        /*
         * Bảo vệ khỏi lưu trùng trong trường hợp
         * advisor gọi add lại cùng message.
         */
        if (isDuplicateLastMessage(
                conversationId,
                role,
                content
        )) {
            return;
        }

        ChatMessageDocument document =
                new ChatMessageDocument();

        document.setSessionId(conversationId);
        document.setRole(role);
        document.setContent(content);
        document.setSentAt(Instant.now());

        messageRepository.save(document);
    }

    /*
     * =========================================================
     * DUPLICATE PROTECTION
     * =========================================================
     */

    private boolean isDuplicateLastMessage(
            String conversationId,
            String role,
            String content) {

        List<ChatMessageDocument> existingMessages =
                messageRepository
                        .findBySessionIdOrderBySentAtAsc(
                                conversationId
                        );

        if (existingMessages.isEmpty()) {
            return false;
        }

        ChatMessageDocument lastMessage =
                existingMessages.get(
                        existingMessages.size() - 1
                );

        return role.equalsIgnoreCase(
                lastMessage.getRole()
        ) && content.equals(
                lastMessage.getContent()
        );
    }

    /*
     * =========================================================
     * MAPPING: MONGO -> SPRING AI
     * =========================================================
     */

    private Message toSpringAiMessage(
            ChatMessageDocument document) {

        if (document == null
                || document.getRole() == null
                || document.getContent() == null
                || document.getContent().isBlank()) {

            return null;
        }

        String role =
                document.getRole()
                        .trim()
                        .toUpperCase(Locale.ROOT);

        return switch (role) {

            case "USER" ->
                    new UserMessage(
                            document.getContent()
                    );

            case "ASSISTANT" ->
                    new AssistantMessage(
                            document.getContent()
                    );

            default -> null;
        };
    }

    /*
     * =========================================================
     * MAPPING: SPRING AI -> MONGO
     * =========================================================
     */

    private String toStoredRole(
            MessageType messageType) {

        if (messageType == null) {
            return null;
        }

        return switch (messageType) {

            case USER -> "USER";

            case ASSISTANT -> "ASSISTANT";

            default -> null;
        };
    }

    private void validateConversationId(
            String conversationId) {

        if (conversationId == null
                || conversationId.isBlank()) {

            throw new IllegalArgumentException(
                    "Conversation ID không được để trống"
            );
        }
    }
}