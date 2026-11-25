package com.campusq.service;

import com.campusq.dto.request.StudentRegistrationRequest;
import com.campusq.dto.response.StudentRegistrationResponse;
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
public class StudentService {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CollegeRepository collegeRepository) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.collegeRepository = collegeRepository;
    }

    @Transactional
    public StudentRegistrationResponse registerStudent(StudentRegistrationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String normalizedCode = request.getCollegeCode().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered");
        }

        College college = collegeRepository
                .findByCollegeCode(normalizedCode)
                .filter(College::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive college code"));

        Role targetRole = Role.STUDENT;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            String requestedRole = request.getRole().trim().toUpperCase(Locale.ROOT);
            if ("STAFF".equals(requestedRole)) {
                targetRole = Role.STAFF;
            } else if (!"STUDENT".equals(requestedRole)) {
                throw new BadRequestException("Registration role must be STUDENT or STAFF");
            }
        }

        AppUser user = new AppUser();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(targetRole);
        user.setCollege(college);
        user.setStaffVerified(false);
        user.setActive(true);

        AppUser savedUser = userRepository.save(user);

        StudentRegistrationResponse response = new StudentRegistrationResponse();
        response.setId(savedUser.getId());
        response.setFullName(savedUser.getFullName());
        response.setEmail(savedUser.getEmail());
        response.setRole(savedUser.getRole());
        response.setCreatedAt(savedUser.getCreatedAt());
        response.setCollegeCode(savedUser.getCollege().getCollegeCode());

        return response;
    }
}
