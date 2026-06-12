package be.backend.controller;

import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.request.ViewHistoryRequest;
import be.backend.model.response.PageResponse;
import be.backend.services.ViewHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class ViewHistoryController {

    private final ViewHistoryService viewHistoryService;

    /**
     * Ghi nhận lịch sử xem phim
     */
    @PostMapping
    public ResponseEntity<ViewHistoryDto> recordViewHistory(@Valid @RequestBody ViewHistoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(viewHistoryService.recordViewHistory(request));
    }

    /**
     * Lấy lịch sử xem phim của user hiện tại
     */
    @GetMapping
    public ResponseEntity<PageResponse<ViewHistoryDto>> getMyViewHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(viewHistoryService.getMyViewHistory(page, size));
    }

    /**
     * Xóa toàn bộ lịch sử xem của user
     */
    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearViewHistory() {
        viewHistoryService.clearViewHistory();
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa một mục lịch sử xem cụ thể
     */
    @DeleteMapping("/{viewId}")
    public ResponseEntity<Void> deleteViewHistoryItem(@PathVariable Integer viewId) {
        viewHistoryService.deleteViewHistoryItem(viewId);
        return ResponseEntity.noContent().build();
    }
}
