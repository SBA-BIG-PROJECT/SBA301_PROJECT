package be.backend.services;

import be.backend.model.dto.GenreDto;
import java.util.List;

public interface GenreService {
    List<GenreDto> getAllGenres();
}