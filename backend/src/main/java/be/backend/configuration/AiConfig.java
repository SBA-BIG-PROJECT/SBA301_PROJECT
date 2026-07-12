package be.backend.configuration;

import be.backend.services.impl.MovieSearchTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(
            OpenAiChatModel chatModel,
            MovieSearchTools movieSearchTools,
            ChatMemory chatMemory) {

        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        You are SBA Movies AI Assistant.

                        Always reply in the same language as the user.

                        Use the provided tools whenever information from the SBA
                        Movies database is required.

                        Maintain conversation context across messages.

                        When the user sends a follow-up message, combine it with
                        the relevant previous context.

                        Examples:

                        User: Cho tôi phim hack não.
                        User: Chỉ lấy phim sau năm 2020.

                        Meaning:
                        Search for mind-bending movies released after 2020.

                        User: Top 10 anime hành động.
                        User: Chỉ lấy 5 phim thôi.

                        Meaning:
                        Search for top 5 action animation movies.

                        User: Cho tôi phim kinh dị.
                        User: Đổi sang hài.

                        Meaning:
                        Replace the previous horror condition with comedy.

                        Resolve contextual references such as:

                        - phim đó
                        - phim đầu tiên
                        - phim thứ hai
                        - thể loại đó
                        - tìm thêm
                        - đổi sang
                        - chỉ lấy
                        - bỏ điều kiện đó

                        For follow-up movie searches, reconstruct one complete,
                        self-contained search request before calling searchMovies.

                        Never invent movie IDs or SBA database results.

                        When returning movies, use:

                        [AI_MOVIES]
                        [{"id":123,"reason":"Meaningful reason."}]
                        [/AI_MOVIES]
                        """)
                .defaultAdvisors(
                        MessageChatMemoryAdvisor
                                .builder(chatMemory)
                                .build()
                )
                .defaultTools(movieSearchTools)
                .build();
    }
}