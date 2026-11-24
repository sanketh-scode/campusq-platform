package com.campusq.service;

import com.campusq.dto.request.CollegeAdminCreationRequest;
import com.campusq.dto.response.CollegeAdminCreationResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.enums.Role;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ConflictException;
import com.campusq.repository.CollegeRepository;
import com.campusq.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        AppUser savedAdmin = userRepository.save(admin);

        CollegeAdminCreationResponse response = new CollegeAdminCreationResponse();
        response.setId(savedAdmin.getId());
        response.setFullName(savedAdmin.getFullName());
        response.setEmail(savedAdmin.getEmail());
        response.setRole(savedAdmin.getRole().name());
        response.setCollegeName(college.getCollegeName());
        response.setCollegeCode(college.getCollegeCode());
        response.setCreatedAt(savedAdmin.getCreatedAt());

        return response;
    }
}