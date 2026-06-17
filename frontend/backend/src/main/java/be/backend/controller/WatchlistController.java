package be.backend.controller;

import be.backend.model.dto.WatchlistDto;
import be.backend.model.response.PageResponse;
import be.backend.services.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @PostMapping("/{movieId}")
    public ResponseEntity<WatchlistDto> addToWatchlist(@PathVariable Integer movieId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(watchlistService.addToWatchlist(movieId));
    }

    @GetMapping
    public ResponseEntity<PageResponse<WatchlistDto>> getMyWatchlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(watchlistService.getMyWatchlist(page, size));
    }

    @GetMapping("/check/{movieId}")
    public ResponseEntity<Map<String, Boolean>> checkInWatchlist(@PathVariable Integer movieId) {
        boolean isInWatchlist = watchlistService.isInWatchlist(movieId);
        return ResponseEntity.ok(Map.of("isInWatchlist", isInWatchlist));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Integer movieId) {
        watchlistService.removeFromWatchlist(movieId);
        return ResponseEntity.noContent().build();
    }
}
