package com.campusq.service;

import com.campusq.dto.request.LoginRequest;
import com.campusq.dto.response.LoginResponse;
import com.campusq.entity.AppUser;
import com.campusq.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService) {

        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.getPassword()
                )
        );

        AppUser user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());

        if (user.getCollege() != null) {
            response.setCollegeCode(user.getCollege().getCollegeCode());
        }

        return response;
    }
}