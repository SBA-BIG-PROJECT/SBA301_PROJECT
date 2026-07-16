package be.backend.services.impl;

import be.backend.repository.UserRepository;
import be.backend.configuration.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        var user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + email));

        if (user.getDeletedAt() != null) {
            throw new DisabledException("Your account has been deactivated. Please contact levonhatquang11@gmail.com for support.");
        }
        if (user.getBannedAt() != null) {
            throw new LockedException("Your account has been locked. Reason: " + user.getBannedReason() + ". Please contact levonhatquang11@gmail.com for support.");
        }

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                List.of(
                        new SimpleGrantedAuthority(
                                "ROLE_" + user.getRole()
                        )
                ),
                true,
                true
        );
    }
}