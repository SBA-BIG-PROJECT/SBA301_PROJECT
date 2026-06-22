package be.backend.document;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document(collection = "chat_sessions")
public class ChatSessionDocument {

    @Id
    private String id;

    private Integer userId;

    private String title;

    private Instant startedAt;
}