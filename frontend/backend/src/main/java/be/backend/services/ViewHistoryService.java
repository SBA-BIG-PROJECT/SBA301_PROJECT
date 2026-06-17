package be.backend.services;

import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.request.ViewHistoryRequest;
import be.backend.model.response.PageResponse;

public interface ViewHistoryService {
    ViewHistoryDto recordViewHistory(ViewHistoryRequest request);
    PageResponse<ViewHistoryDto> getMyViewHistory(int page, int size);
    void clearViewHistory();
    void deleteViewHistoryItem(Integer viewId);
}
