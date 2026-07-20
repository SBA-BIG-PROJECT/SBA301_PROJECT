package be.backend.services;

import be.backend.model.dto.CategoryDto;
import be.backend.model.request.CreateCategoryRequest;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
    
    // --- Admin Methods ---
    CategoryDto createCategoryAdmin(CreateCategoryRequest request);
    CategoryDto updateCategoryAdmin(String categoryId, String newName);
    void deleteCategoryAdmin(String categoryId);
}
