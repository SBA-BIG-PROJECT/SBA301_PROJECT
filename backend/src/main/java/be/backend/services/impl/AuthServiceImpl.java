package be.backend.services.impl;

import be.backend.entity.Movie;
import be.backend.entity.Payment;
import be.backend.entity.RefreshToken;
import be.backend.entity.Review;
import be.backend.entity.User;
import be.backend.entity.ViewLog;
import be.backend.entity.Watchlist;
import be.backend.enums.UserRole;
import be.backend.exception.EmailAlreadyExistsException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.AdminUserMapper;
import be.backend.mapper.ReviewMapper;
import be.backend.mapper.UserMapper;
import be.backend.model.dto.AdminPaymentDto;
import be.backend.model.dto.AdminUserDto;
import be.backend.model.dto.ReviewDto;
import be.backend.model.dto.ViewHistoryDto;
import be.backend.model.dto.WatchlistDto;
import be.backend.model.request.AdminUpdateUserRequest;
import be.backend.model.request.LoginRequest;
import be.backend.model.request.RegisterRequest;
import be.backend.model.response.AdminUserDetailResponse;
import be.backend.model.response.AuthResponse;
import be.backend.model.response.PageResponse;
import be.backend.repository.PaymentRepository;
import be.backend.repository.ReviewRepository;
import be.backend.repository.UserRepository;
import be.backend.repository.ViewLogRepository;
import be.backend.repository.WatchlistRepository;
import be.backend.services.AuthService;
import be.backend.services.JwtService;
import be.backend.services.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenService refreshTokenService;
    
    // Admin specific dependencies
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final WatchlistRepository watchlistRepository;
    private final ViewLogRepository viewLogRepository;
    private final AdminUserMapper adminUserMapper;
    private final ReviewMapper reviewMapper;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already in use");
        }

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");  // Default role is USER
        user.setIsPremium(false);
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        return buildTokens(user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return buildTokens(user);
    }

    @Override
    public AuthResponse refresh(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenService.verifyAndGet(refreshTokenStr);
        User user = refreshToken.getUser();

        var userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMillis() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    public void logout(String refreshTokenStr) {
        refreshTokenService.deleteByToken(refreshTokenStr);
    }

    private AuthResponse buildTokens(User user) {
        var userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMillis() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    // --- Admin Methods ---

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> getAllUsersAdmin(int page, int size, String search, String role, Boolean isPremium) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<User> userPage = userRepository.findByFilters(search, role, isPremium, pageable);
        
        List<Integer> userIds = userPage.getContent().stream().map(User::getId).toList();
        java.util.Map<Integer, Object[]> statsMap = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            List<Object[]> batchStats = userRepository.findUserStatsBatch(userIds);
            for (Object[] row : batchStats) {
                statsMap.put((Integer) row[0], row);
            }
        }
        
        Page<AdminUserDto> dtoPage = userPage.map(user -> {
            AdminUserDto dto = adminUserMapper.toAdminDto(user);
            Object[] stats = statsMap.get(user.getId());
            if (stats != null) {
                dto.setTotalReviews(((Number) stats[1]).longValue());
                dto.setTotalWatchlist(((Number) stats[2]).longValue());
                dto.setTotalViews(((Number) stats[3]).longValue());
                dto.setTotalPayments(((Number) stats[4]).longValue());
                dto.setTotalSpent(stats[5] != null ? (BigDecimal) stats[5] : BigDecimal.ZERO);
            } else {
                dto.setTotalReviews(0L);
                dto.setTotalWatchlist(0L);
                dto.setTotalViews(0L);
                dto.setTotalPayments(0L);
                dto.setTotalSpent(BigDecimal.ZERO);
            }
            dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
            return dto;
        });
        
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetailAdmin(Integer userId) {
        User user = findUserById(userId);
        
        AdminUserDto userDto = adminUserMapper.toAdminDto(user);
        enrichUserStats(userDto, user);
        
        List<ReviewDto> recentReviews = reviewRepository.findTop10ByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(reviewMapper::toDto)
            .toList();

        List<WatchlistDto> recentWatchlist = watchlistRepository.findByUser_IdOrderByAddedAtDesc(userId, PageRequest.of(0, 10))
            .getContent()
            .stream()
            .map(this::toWatchlistDto)
            .toList();

        List<ViewHistoryDto> recentViews = viewLogRepository.findTop20ByUser_IdOrderByWatchedAtDesc(userId)
            .stream()
            .limit(10)
            .map(this::toViewHistoryDto)
            .toList();

        List<AdminPaymentDto> paymentHistory = paymentRepository.findByUser_IdOrderByCreatedAtDesc(userId)
            .stream()
            .limit(10)
            .map(this::toAdminPaymentDto)
            .toList();
        
        return new AdminUserDetailResponse(
            userDto,
            recentReviews,
            recentWatchlist,
            recentViews,
            paymentHistory
        );
    }

    @Override
    @Transactional
    public AdminUserDto updateUserAdmin(Integer userId, AdminUpdateUserRequest request) {
        User user = findUserById(userId);
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getAdminNotes() != null) {
            user.setAdminNotes(request.getAdminNotes());
        }

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                user.setDeletedAt(null);
                user.setBannedAt(null);
                user.setBannedReason(null);
            } else {
                user.setDeletedAt(Instant.now());
            }
        }
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin updated user: {} (fullName, adminNotes and/or isActive)", userId);
        return dto;
    }

    @Override
    @Transactional
    public void deleteUserAdmin(Integer userId) {
        User user = findUserById(userId);
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        
        log.info("Admin deleted user: {}", userId);
    }

    @Override
    @Transactional
    public AdminUserDto changeUserRoleAdmin(Integer userId, String newRole) {
        User user = findUserById(userId);
        
        try {
            UserRole role = UserRole.fromString(newRole);
            user.setRole(role.getValue());
            User updated = userRepository.save(user);
            
            AdminUserDto dto = adminUserMapper.toAdminDto(updated);
            enrichUserStats(dto, updated);
            
            log.info("Admin changed user {} role to: {}", userId, newRole);
            return dto;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }
    }

    @Override
    @Transactional
    public AdminUserDto revokePremiumAdmin(Integer userId) {
        User user = findUserById(userId);
        
        user.setIsPremium(false);
        user.setPremiumExpiresAt(null);
        
        User updated = userRepository.save(user);
        AdminUserDto dto = adminUserMapper.toAdminDto(updated);
        enrichUserStats(dto, updated);
        
        log.info("Admin revoked premium from user: {}", userId);
        return dto;
    }

    private User findUserById(Integer userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void enrichUserStats(AdminUserDto dto, User user) {
        List<Object[]> batchStats = userRepository.findUserStatsBatch(List.of(user.getId()));
        if (!batchStats.isEmpty()) {
            Object[] stats = batchStats.get(0);
            dto.setTotalReviews(((Number) stats[1]).longValue());
            dto.setTotalWatchlist(((Number) stats[2]).longValue());
            dto.setTotalViews(((Number) stats[3]).longValue());
            dto.setTotalPayments(((Number) stats[4]).longValue());
            dto.setTotalSpent(stats[5] != null ? (BigDecimal) stats[5] : BigDecimal.ZERO);
        } else {
            dto.setTotalReviews(0L);
            dto.setTotalWatchlist(0L);
            dto.setTotalViews(0L);
            dto.setTotalPayments(0L);
            dto.setTotalSpent(BigDecimal.ZERO);
        }
        
        dto.setIsActive(user.getDeletedAt() == null && user.getBannedAt() == null);
    }

    private ViewHistoryDto toViewHistoryDto(ViewLog v) {
        ViewHistoryDto dto = new ViewHistoryDto();
        dto.setId(v.getId());
        dto.setWatchedAt(v.getWatchedAt());
        dto.setWatchDuration(v.getWatchDuration());

        Movie movie = v.getTmdb();
        if (movie != null) {
            dto.setMovieId(movie.getId());
            dto.setMovieTitle(movie.getTitle());
            dto.setPosterPath(movie.getPosterPath());
            dto.setOverview(movie.getOverview());
            dto.setReleaseDate(movie.getReleaseDate());
            dto.setVoteAverage(movie.getVoteAverage());
            dto.setVoteCount(movie.getVoteCount());
        }

        return dto;
    }

    private WatchlistDto toWatchlistDto(Watchlist w) {
        WatchlistDto dto = new WatchlistDto();
        dto.setId(w.getId());
        dto.setAddedAt(w.getAddedAt());
        
        Movie movie = w.getTmdb();
        if (movie != null) {
            dto.setMovieId(movie.getId());
            dto.setMovieTitle(movie.getTitle());
            dto.setPosterPath(movie.getPosterPath());
            dto.setReleaseDate(movie.getReleaseDate());
            dto.setVoteAverage(movie.getVoteAverage());
            dto.setVoteCount(movie.getVoteCount());
        }
        return dto;
    }

    private AdminPaymentDto toAdminPaymentDto(Payment payment) {
        AdminPaymentDto dto = new AdminPaymentDto();
        dto.setPaymentId(payment.getId());
        if (payment.getUser() != null) {
            dto.setUserId(payment.getUser().getId());
            dto.setUserEmail(payment.getUser().getEmail());
            dto.setUserFullName(payment.getUser().getFullName());
        }
        dto.setPlanType(payment.getPlanType());
        dto.setAmount(payment.getAmount());
        dto.setStatus(payment.getStatus());
        dto.setOrderCode(payment.getOrderCode());
        dto.setPaymentLinkId(payment.getPaymentLinkId());
        dto.setTransactionId(payment.getTransactionId());
        dto.setPaidAt(payment.getPaidAt());
        dto.setStartsAt(payment.getStartsAt());
        dto.setExpiresAt(payment.getExpiresAt());
        dto.setCreatedAt(payment.getCreatedAt());
        return dto;
    }
}