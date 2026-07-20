package be.backend.controller;

import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateGenreRequest;
import be.backend.model.response.MessageResponse;
import be.backend.services.GenreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    @GetMapping
    public ResponseEntity<List<GenreDto>> getGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    // --- Admin Methods ---

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<GenreDto>> getAllGenresAdmin() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<GenreDto> createGenre(@Valid @RequestBody CreateGenreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(genreService.createGenreAdmin(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{genreId}")
    public ResponseEntity<GenreDto> updateGenre(
            @PathVariable Integer genreId,
            @RequestParam String newName) {
        
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("newName is required");
        }
        
        return ResponseEntity.ok(genreService.updateGenreAdmin(genreId, newName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{genreId}")
    public ResponseEntity<MessageResponse> deleteGenre(@PathVariable Integer genreId) {
        genreService.deleteGenreAdmin(genreId);
        return ResponseEntity.ok(MessageResponse.of("Genre deleted successfully"));
    }
}