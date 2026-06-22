package be.backend.controller;

import be.backend.model.dto.CategoryDto;
import be.backend.model.request.CreateCategoryRequest;
import be.backend.model.response.MessageResponse;
import be.backend.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // --- Admin Methods ---

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.createCategoryAdmin(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{categoryId}")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable String categoryId,
            @RequestParam String newName) {
        
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("newName is required");
        }
        
        return ResponseEntity.ok(categoryService.updateCategoryAdmin(categoryId, newName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{categoryId}")
    public ResponseEntity<MessageResponse> deleteCategory(@PathVariable String categoryId) {
        categoryService.deleteCategoryAdmin(categoryId);
        return ResponseEntity.ok(MessageResponse.of("Category deleted successfully"));
    }
}
