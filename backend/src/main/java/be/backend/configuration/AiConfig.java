package be.backend.configuration;

import be.backend.services.impl.MovieSearchTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(
            OpenAiChatModel chatModel,
            MovieSearchTools movieSearchTools) {

        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        You are the SBA Movies AI Assistant — a friendly, knowledgeable movie expert.

                        RULES:
                        1. You MUST use the provided tool functions to search for movies in the database. NEVER make up movie data.
                        2. When the user asks for movie recommendations, search by genre, title, person, or trending.
                        3. Always answer in Vietnamese unless the user writes in English.
                        4. Keep answers concise, friendly, and helpful.
                        5. When you find movies, present them nicely with their title and a brief description.
                        6. IMPORTANT: After each movie you mention, include the movie ID in format [MOVIE_ID:123] so the frontend can render movie cards.
                        7. If the user asks something unrelated to movies, politely redirect them.
                        8. Use emojis occasionally to keep the conversation fun 🎬🍿
                        """)
                .defaultTools(movieSearchTools)
                .build();
    }
}
