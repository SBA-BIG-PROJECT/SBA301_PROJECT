package be.backend.services;

import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateGenreRequest;

import java.util.List;

public interface GenreService {
    List<GenreDto> getAllGenres();
    
    // --- Admin Methods ---
    GenreDto createGenreAdmin(CreateGenreRequest request);
    GenreDto updateGenreAdmin(Integer genreId, String newName);
    void deleteGenreAdmin(Integer genreId);
}