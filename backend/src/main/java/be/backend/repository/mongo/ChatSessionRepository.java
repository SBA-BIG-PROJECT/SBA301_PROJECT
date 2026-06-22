package be.backend.repository.mongo;

import be.backend.document.ChatSessionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatSessionRepository
        extends MongoRepository<ChatSessionDocument, String> {

    List<ChatSessionDocument> findByUserIdOrderByStartedAtDesc(
            Integer userId
    );
}