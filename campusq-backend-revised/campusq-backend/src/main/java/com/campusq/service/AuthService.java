package com.campusq.service;

import com.campusq.dto.request.GoogleCompleteRegistrationRequest;
import com.campusq.dto.request.GoogleLoginRequest;
import com.campusq.dto.request.LoginRequest;
import com.campusq.dto.response.LoginResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.entity.Vendor;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ConflictException;
import com.campusq.exception.ForbiddenException;
import com.campusq.repository.CollegeRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final VendorRepository vendorRepository;
    private final VendorService vendorService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String googleClientId;
    private final RestClient restClient;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            CollegeRepository collegeRepository,
            VendorRepository vendorRepository,
            VendorService vendorService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.google.client-id:}") String googleClientId) {

        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.collegeRepository = collegeRepository;
        this.vendorRepository = vendorRepository;
        this.vendorService = vendorService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId != null ? googleClientId.trim() : "";
        this.restClient = RestClient.create();
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

        return buildLoginResponse(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse googleLogin(GoogleLoginRequest request) {
        GoogleUserInfo googleUser = verifyGoogleIdToken(request.getIdToken());

        return userRepository.findByEmail(googleUser.email())
                .map(user -> {
                    if (!user.isActive()) {
                        throw new ForbiddenException("Your account has been deactivated");
                    }
                    return buildLoginResponse(user);
                })
                .orElseGet(() -> {
                    LoginResponse pending = new LoginResponse();
                    pending.setNeedsRegistration(true);
                    pending.setEmail(googleUser.email());
                    pending.setFullName(googleUser.fullName());
                    return pending;
                });
    }

    @Transactional
    public LoginResponse completeGoogleRegistration(GoogleCompleteRegistrationRequest request) {
        GoogleUserInfo googleUser = verifyGoogleIdToken(request.getIdToken());

        if (userRepository.existsByEmail(googleUser.email())) {
            throw new ConflictException("Account already exists. Please sign in with Google.");
        }

        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);
        College college = collegeRepository
                .findByCollegeCode(normalizedCode)
                .filter(College::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive college code"));

        String roleInput = request.getRole().trim().toUpperCase(Locale.ROOT);
        Role targetRole;
        if ("STUDENT".equals(roleInput)) {
            targetRole = Role.STUDENT;
        } else if ("STAFF".equals(roleInput)) {
            targetRole = Role.STAFF;
        } else if ("VENDOR".equals(roleInput)) {
            targetRole = Role.VENDOR;
        } else {
            throw new BadRequestException("Google registration role must be STUDENT, STAFF, or VENDOR");
        }

        AppUser user = new AppUser();
        user.setFullName(googleUser.fullName());
        user.setEmail(googleUser.email());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(targetRole);
        user.setCollege(college);
        user.setStaffVerified(false);
        user.setActive(true);

        AppUser savedUser = userRepository.save(user);

        if (targetRole == Role.VENDOR) {
            if (request.getShopName() == null || request.getShopName().isBlank()
                    || request.getLocation() == null || request.getLocation().isBlank()
                    || request.getCategories() == null || request.getCategories().isEmpty()) {
                throw new BadRequestException("Shop name, location, and at least one category are required for vendors");
            }

            Vendor vendor = new Vendor();
            vendor.setUser(savedUser);
            vendor.setShopName(request.getShopName().trim());
            vendor.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
            vendor.setLocation(request.getLocation().trim());
            vendor.setCustomCategory(
                    request.getCustomCategory() != null && !request.getCustomCategory().isBlank()
                            ? request.getCustomCategory().trim()
                            : null
            );
            vendor.setQrCodeImage(
                    request.getQrCodeImage() != null && !request.getQrCodeImage().isBlank()
                            ? request.getQrCodeImage().trim()
                            : null
            );
            vendor.setApprovalStatus(VendorStatus.PENDING);
            vendor.setAvailable(false);

            Vendor savedVendor = vendorRepository.save(vendor);
            vendorService.saveVendorCategories(savedVendor, request.getCategories());
        }

        return buildLoginResponse(savedUser);
    }

    private LoginResponse buildLoginResponse(AppUser user) {
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
        response.setStaffVerified(user.isStaffVerified());
        response.setStaffStatusNotice(user.getStaffStatusNotice());
        response.setNeedsRegistration(false);

        if (user.getCollege() != null) {
            response.setCollegeCode(user.getCollege().getCollegeCode());
            response.setCollegeName(user.getCollege().getCollegeName());
        }

        return response;
    }

    @SuppressWarnings("unchecked")
    private GoogleUserInfo verifyGoogleIdToken(String idToken) {
        if (googleClientId.isEmpty()) {
            throw new BadRequestException("Google Sign-In is not configured on the server (GOOGLE_CLIENT_ID missing)");
        }

        Map<String, Object> payload;
        try {
            payload = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid or expired Google Sign-In token");
        }

        if (payload == null) {
            throw new BadRequestException("Unable to verify Google Sign-In token");
        }

        Object aud = payload.get("aud");
        if (aud == null || !googleClientId.equals(aud.toString())) {
            throw new BadRequestException("Google token audience mismatch");
        }

        Object emailVerified = payload.get("email_verified");
        if (emailVerified == null || !"true".equalsIgnoreCase(emailVerified.toString())) {
            throw new BadRequestException("Google account email is not verified");
        }

        Object emailObj = payload.get("email");
        if (emailObj == null || emailObj.toString().isBlank()) {
            throw new BadRequestException("Google account email is missing");
        }

        String email = emailObj.toString().trim().toLowerCase(Locale.ROOT);
        Object nameObj = payload.get("name");
        String fullName = (nameObj != null && !nameObj.toString().isBlank())
                ? nameObj.toString().trim()
                : email.split("@")[0];

        return new GoogleUserInfo(email, fullName);
    }

    private record GoogleUserInfo(String email, String fullName) {
    }
}