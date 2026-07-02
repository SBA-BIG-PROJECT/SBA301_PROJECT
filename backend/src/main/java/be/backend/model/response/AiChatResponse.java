package be.backend.model.response;

import be.backend.model.dto.RecommendationDto;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AiChatResponse {
    private String text;
    private List<RecommendationDto> movies;
}
