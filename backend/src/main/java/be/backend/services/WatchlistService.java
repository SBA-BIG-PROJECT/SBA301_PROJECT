package be.backend.services;

import be.backend.model.dto.WatchlistDto;
import be.backend.model.response.PageResponse;

public interface WatchlistService {
    WatchlistDto addToWatchlist(Integer movieId);
    PageResponse<WatchlistDto> getMyWatchlist(int page, int size);
    boolean isInWatchlist(Integer movieId);
    void removeFromWatchlist(Integer movieId);
}
