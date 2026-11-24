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

        AppUser student = new AppUser();
        student.setFullName(request.getFullName().trim());
        student.setEmail(normalizedEmail);
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        student.setRole(Role.STUDENT);
        student.setCollege(college);

        AppUser savedStudent = userRepository.save(student);

        StudentRegistrationResponse response = new StudentRegistrationResponse();
        response.setId(savedStudent.getId());
        response.setFullName(savedStudent.getFullName());
        response.setEmail(savedStudent.getEmail());
        response.setRole(savedStudent.getRole());
        response.setCreatedAt(savedStudent.getCreatedAt());
        response.setCollegeCode(savedStudent.getCollege().getCollegeCode());

        return response;
    }
}
