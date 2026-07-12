package be.backend.controller;

import be.backend.services.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
public class StreamController {

    private final MovieService movieService;

    @Value("${app.frontend-origin}")
    private String allowedOrigin;

    @GetMapping("/play")
    public ResponseEntity<Map<String, String>> play(
            @RequestParam String token,
            @RequestHeader(value = "Referer", required = false) String referer) {


        if (referer != null && !referer.startsWith(allowedOrigin)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String embedUrl = movieService.resolveEmbedUrl(token);
        if (embedUrl == null) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(Map.of("embedUrl", embedUrl));
    }
}