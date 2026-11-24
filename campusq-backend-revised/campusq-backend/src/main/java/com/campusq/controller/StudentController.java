package com.campusq.controller;

import com.campusq.dto.request.StudentRegistrationRequest;
import com.campusq.dto.response.StudentRegistrationResponse;
import com.campusq.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping("/register")
    public ResponseEntity<StudentRegistrationResponse> registerStudent(
            @Valid @RequestBody StudentRegistrationRequest request) {

        StudentRegistrationResponse response = studentService.registerStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
