package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.entity.User;
import be.backend.entity.ViewLog;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.request.ViewHistoryRequest;
import be.backend.model.response.PageResponse;
import be.backend.repository.MovieRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.ViewHistoryRepository;
import be.backend.services.ViewHistoryService;
import be.backend.mapper.ViewLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ViewHistoryServiceImpl implements ViewHistoryService {

    private final ViewHistoryRepository viewHistoryRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final ViewLogMapper viewLogMapper;

    @Override
    @Transactional
    public ViewHistoryDto recordViewHistory(ViewHistoryRequest request) {
        User user = getCurrentUser();
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found with id=" + request.getMovieId()));

        // Check if this movie has been watched, if yes then update, otherwise create new
        Optional<ViewLog> existingLog = viewHistoryRepository
                .findTopByUser_IdAndTmdb_IdOrderByWatchedAtDesc(user.getId(), request.getMovieId());

        ViewLog viewLog;
        if (existingLog.isPresent()) {
            // Update current view log
            viewLog = existingLog.get();
            viewLog.setWatchedAt(Instant.now());
            viewLog.setWatchDuration(request.getWatchDuration());
        } else {
            // Create new view log
            viewLog = new ViewLog();
            viewLog.setUser(user);
            viewLog.setTmdb(movie);
            viewLog.setWatchedAt(Instant.now());
            viewLog.setWatchDuration(request.getWatchDuration());
        }

        return viewLogMapper.toDto(viewHistoryRepository.save(viewLog));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ViewHistoryDto> getMyViewHistory(int page, int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<ViewLog> result = viewHistoryRepository.findByUser_IdOrderByWatchedAtDesc(user.getId(), pageable);

        List<ViewHistoryDto> content = result.getContent().stream().map(viewLogMapper::toDto).toList();

        return PageResponse.<ViewHistoryDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional
    public void clearViewHistory() {
        User user = getCurrentUser();
        List<ViewLog> userViewLogs = viewHistoryRepository
                .findByUser_IdOrderByWatchedAtDesc(user.getId(), Pageable.unpaged())
                .getContent();
        viewHistoryRepository.deleteAll(userViewLogs);
    }

    @Override
    @Transactional
    public void deleteViewHistoryItem(Integer viewId) {
        User user = getCurrentUser();
        ViewLog viewLog = viewHistoryRepository.findById(viewId)
                .orElseThrow(() -> new ResourceNotFoundException("View history not found with id=" + viewId));

        // Check if this view history belongs to the current user
        if (!viewLog.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("View history not found with id=" + viewId);
        }

        viewHistoryRepository.delete(viewLog);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

}
