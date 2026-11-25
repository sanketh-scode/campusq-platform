package com.campusq.controller;

import com.campusq.dto.request.GoogleCompleteRegistrationRequest;
import com.campusq.dto.request.GoogleLoginRequest;
import com.campusq.dto.request.LoginRequest;
import com.campusq.dto.response.LoginResponse;
import com.campusq.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.googleLogin(request));
    }

    @PostMapping("/google/complete")
    public ResponseEntity<LoginResponse> completeGoogleRegistration(
            @Valid @RequestBody GoogleCompleteRegistrationRequest request) {
        return ResponseEntity.ok(authService.completeGoogleRegistration(request));
    }
}
