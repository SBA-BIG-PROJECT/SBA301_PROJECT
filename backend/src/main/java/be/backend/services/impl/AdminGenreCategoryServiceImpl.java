package be.backend.services.impl;

import be.backend.entity.Category;
import be.backend.entity.Genre;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.CategoryDto;
import be.backend.model.dto.GenreDto;
import be.backend.model.request.CreateCategoryRequest;
import be.backend.model.request.CreateGenreRequest;
import be.backend.repository.CategoryRepository;
import be.backend.repository.GenreRepository;
import be.backend.services.AdminGenreCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Genre and Category Service Implementation
 * Handles all admin operations related to genre and category management
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminGenreCategoryServiceImpl implements AdminGenreCategoryService {

    private final GenreRepository genreRepository;
    private final CategoryRepository categoryRepository;

    // ========== Genre Operations ==========
    
    @Override
    @Transactional(readOnly = true)
    public List<GenreDto> getAllGenres() {
        return genreRepository.findAll().stream()
            .map(genre -> new GenreDto(genre.getId(), genre.getName()))
            .collect(Collectors.toList());
    }

    @Override
    public GenreDto createGenre(CreateGenreRequest request) {
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
    public GenreDto updateGenre(Integer genreId, String newName) {
        Genre genre = genreRepository.findById(genreId)
            .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
        
        genre.setName(newName);
        Genre updated = genreRepository.save(genre);
        
        log.info("Admin updated genre {} to: {}", genreId, newName);
        return new GenreDto(updated.getId(), updated.getName());
    }

    @Override
    public void deleteGenre(Integer genreId) {
        if (!genreRepository.existsById(genreId)) {
            throw new ResourceNotFoundException("Genre not found: " + genreId);
        }
        
        genreRepository.deleteById(genreId);
        log.info("Admin deleted genre: {}", genreId);
    }

    // ========== Category Operations ==========
    
    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(category -> new CategoryDto(category.getCategoryId(), category.getName()))
            .collect(Collectors.toList());
    }

    @Override
    public CategoryDto createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByCategoryId(request.getCategoryId())) {
            throw new IllegalArgumentException("Category with ID " + request.getCategoryId() + " already exists");
        }
        
        Category category = new Category();
        category.setCategoryId(request.getCategoryId());
        category.setName(request.getName());
        
        Category saved = categoryRepository.save(category);
        log.info("Admin created category: {} ({})", saved.getName(), saved.getCategoryId());
        
        return new CategoryDto(saved.getCategoryId(), saved.getName());
    }

    @Override
    public CategoryDto updateCategory(String categoryId, String newName) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        
        category.setName(newName);
        Category updated = categoryRepository.save(category);
        
        log.info("Admin updated category {} to: {}", categoryId, newName);
        return new CategoryDto(updated.getCategoryId(), updated.getName());
    }

    @Override
    public void deleteCategory(String categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found: " + categoryId);
        }
        
        categoryRepository.deleteById(categoryId);
        log.info("Admin deleted category: {}", categoryId);
    }
}
