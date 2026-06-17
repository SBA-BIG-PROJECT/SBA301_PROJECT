package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.entity.User;
import be.backend.entity.Watchlist;
import be.backend.exception.DuplicateWatchlistException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.WatchlistDto;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.WatchlistRepository;
import be.backend.services.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchlistServiceImpl implements WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public WatchlistDto addToWatchlist(Integer movieId) {
        User user = getCurrentUser();
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim id=" + movieId));

        if (watchlistRepository.existsByUser_IdAndTmdb_Id(user.getId(), movieId)) {
            throw new DuplicateWatchlistException("Phim này đã có trong Watchlist của bạn rồi");
        }

        Watchlist watchlist = new Watchlist();
        watchlist.setUser(user);
        watchlist.setTmdb(movie);
        watchlist.setAddedAt(Instant.now());

        return toDto(watchlistRepository.save(watchlist));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WatchlistDto> getMyWatchlist(int page, int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Watchlist> result = watchlistRepository.findByUser_IdOrderByAddedAtDesc(user.getId(), pageable);

        List<WatchlistDto> content = result.getContent().stream().map(this::toDto).toList();

        return PageResponse.<WatchlistDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInWatchlist(Integer movieId) {
        User user = getCurrentUser();
        return watchlistRepository.existsByUser_IdAndTmdb_Id(user.getId(), movieId);
    }

    @Override
    @Transactional
    public void removeFromWatchlist(Integer movieId) {
        User user = getCurrentUser();
        Watchlist watchlist = watchlistRepository.findByUser_IdAndTmdb_Id(user.getId(), movieId);
//                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim id=" + movieId + " trong Watchlist của bạn"));
        watchlistRepository.delete(watchlist);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user: " + email));
    }

    private WatchlistDto toDto(Watchlist w) {
        WatchlistDto dto = new WatchlistDto();
        dto.setId(w.getId());
        dto.setAddedAt(w.getAddedAt());
        Movie movie = w.getTmdb();
        dto.setMovieId(movie.getId());
        dto.setMovieTitle(movie.getTitle());
        dto.setPosterPath(movie.getPosterPath());
        dto.setReleaseDate(movie.getReleaseDate());
        dto.setVoteAverage(movie.getVoteAverage());
        dto.setVoteCount(movie.getVoteCount());
        return dto;
    }
}
