package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;
    private Instant timestamp;
    
    public MessageResponse(String message) {
        this.message = message;
        this.timestamp = Instant.now();
    }
    
    public static MessageResponse of(String message) {
        return new MessageResponse(message);
    }
}
