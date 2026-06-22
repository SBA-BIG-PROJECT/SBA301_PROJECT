package be.backend.services.impl;

import be.backend.entity.Category;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.CategoryDto;
import be.backend.model.request.CreateCategoryRequest;
import be.backend.repository.CategoryRepository;
import be.backend.services.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(category -> new CategoryDto(category.getCategoryId(), category.getName()))
            .collect(Collectors.toList());
    }

    // --- Admin Methods ---

    @Override
    @Transactional
    public CategoryDto createCategoryAdmin(CreateCategoryRequest request) {
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
    @Transactional
    public CategoryDto updateCategoryAdmin(String categoryId, String newName) {
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        
        category.setName(newName);
        Category updated = categoryRepository.save(category);
        
        log.info("Admin updated category {} to: {}", categoryId, newName);
        return new CategoryDto(updated.getCategoryId(), updated.getName());
    }

    @Override
    @Transactional
    public void deleteCategoryAdmin(String categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found: " + categoryId);
        }
        
        categoryRepository.deleteById(categoryId);
        log.info("Admin deleted category: {}", categoryId);
    }
}
