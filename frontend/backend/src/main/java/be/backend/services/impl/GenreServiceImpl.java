package be.backend.services.impl;

import be.backend.model.dto.GenreDto;
import be.backend.repository.GenreRepository;
import be.backend.services.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
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
}