package com.campusq.service;

import com.campusq.dto.request.CollegeAdminCreationRequest;
import com.campusq.dto.request.CollegeAdminUpdateRequest;
import com.campusq.dto.response.CollegeAdminCreationResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.enums.Role;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ConflictException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.CollegeRepository;
import com.campusq.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class CollegeAdminService {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;

    public CollegeAdminService(
            UserRepository userRepository,
            CollegeRepository collegeRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.collegeRepository = collegeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CollegeAdminCreationResponse createCollegeAdmin(CollegeAdminCreationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered");
        }

        College college = collegeRepository
                .findByCollegeCode(normalizedCode)
                .filter(College::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive college code"));

        AppUser admin = new AppUser();
        admin.setFullName(request.getFullName().trim());
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(Role.ADMIN);
        admin.setCollege(college);
        admin.setActive(true);

        AppUser savedAdmin = userRepository.save(admin);
        return mapResponse(savedAdmin);
    }

    @Transactional(readOnly = true)
    public List<CollegeAdminCreationResponse> getAllCollegeAdmins() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.ADMIN)
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional
    public CollegeAdminCreationResponse updateCollegeAdmin(
            Long adminId,
            CollegeAdminUpdateRequest request) {

        AppUser admin = userRepository.findById(adminId)
                .filter(u -> u.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("College Admin not found"));

        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);
        College college = collegeRepository
                .findByCollegeCode(normalizedCode)
                .orElseThrow(() -> new BadRequestException("College not found: " + normalizedCode));

        admin.setFullName(request.getFullName().trim());
        admin.setCollege(college);

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        if (request.getActive() != null) {
            admin.setActive(request.getActive());
        }

        return mapResponse(userRepository.save(admin));
    }

    @Transactional
    public void deactivateCollegeAdmin(Long adminId) {
        AppUser admin = userRepository.findById(adminId)
                .filter(u -> u.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("College Admin not found"));

        admin.setActive(false);
        userRepository.save(admin);
    }

    private CollegeAdminCreationResponse mapResponse(AppUser admin) {
        CollegeAdminCreationResponse response = new CollegeAdminCreationResponse();
        response.setId(admin.getId());
        response.setFullName(admin.getFullName());
        response.setEmail(admin.getEmail());
        response.setRole(admin.getRole().name());
        response.setActive(admin.isActive());
        if (admin.getCollege() != null) {
            response.setCollegeName(admin.getCollege().getCollegeName());
            response.setCollegeCode(admin.getCollege().getCollegeCode());
        }
        response.setCreatedAt(admin.getCreatedAt());
        return response;
    }
}