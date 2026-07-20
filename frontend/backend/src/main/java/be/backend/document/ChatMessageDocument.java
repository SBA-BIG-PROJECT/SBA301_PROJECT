package be.backend.document;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document(collection = "chat_messages")
public class ChatMessageDocument {

    @Id
    private String id;

    private String sessionId;

    private String role;

    private String content;

    private Instant sentAt;
}