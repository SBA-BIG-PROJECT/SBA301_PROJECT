package be.backend.repository.mongo;

import be.backend.document.ChatMessageDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository
        extends MongoRepository<ChatMessageDocument, String> {

    List<ChatMessageDocument> findBySessionIdOrderBySentAtAsc(
            String sessionId
    );
}