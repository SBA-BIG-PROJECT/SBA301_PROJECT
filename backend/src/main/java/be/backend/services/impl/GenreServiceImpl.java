package be.backend.services.impl;

import be.backend.entity.Genre;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateGenreRequest;
import be.backend.repository.GenreRepository;
import be.backend.services.GenreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenreServiceImpl implements GenreService {

    private final GenreRepository genreRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GenreDto> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(g -> {
                    GenreDto dto = new GenreDto();
                    dto.setId(g.getId());
                    dto.setName(g.getName());
                    return dto;
                })
                .toList();
    }

    // --- Admin Methods ---

    @Override
    @Transactional
    public GenreDto createGenreAdmin(CreateGenreRequest request) {
        if (genreRepository.existsById(request.getGenreId())) {
            throw new IllegalArgumentException("Genre with ID " + request.getGenreId() + " already exists");
        }
        
        Genre genre = new Genre();
        genre.setId(request.getGenreId());
        genre.setName(request.getName());
        
        Genre saved = genreRepository.save(genre);
        log.info("Admin created genre: {} ({})", saved.getName(), saved.getId());
        
        return new GenreDto(saved.getId(), saved.getName());
    }

    @Override
    @Transactional
    public GenreDto updateGenreAdmin(Integer genreId, String newName) {
        Genre genre = genreRepository.findById(genreId)
            .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
        
        genre.setName(newName);
        Genre updated = genreRepository.save(genre);
        
        log.info("Admin updated genre {} to: {}", genreId, newName);
        return new GenreDto(updated.getId(), updated.getName());
    }

    @Override
    @Transactional
    public void deleteGenreAdmin(Integer genreId) {
        if (!genreRepository.existsById(genreId)) {
            throw new ResourceNotFoundException("Genre not found: " + genreId);
        }
        
        genreRepository.deleteById(genreId);
        log.info("Admin deleted genre: {}", genreId);
    }
}