package com.campusq.controller;

import com.campusq.dto.request.CollegeAdminCreationRequest;
import com.campusq.dto.request.CollegeCreateRequest;
import com.campusq.dto.response.CollegeAdminCreationResponse;
import com.campusq.dto.response.CollegeResponse;
import com.campusq.service.CollegeAdminService;
import com.campusq.service.CollegeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/super-admin")
public class SuperAdminController {

    private final CollegeAdminService collegeAdminService;
    private final CollegeService collegeService;

    public SuperAdminController(
            CollegeAdminService collegeAdminService,
            CollegeService collegeService) {

        this.collegeAdminService = collegeAdminService;
        this.collegeService = collegeService;
    }

    @PostMapping("/colleges")
    public ResponseEntity<CollegeResponse> createCollege(
            @Valid @RequestBody CollegeCreateRequest request) {

        CollegeResponse response = collegeService.createCollege(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/colleges")
    public ResponseEntity<List<CollegeResponse>> getAllColleges() {
        return ResponseEntity.ok(collegeService.getAllColleges());
    }

    @PostMapping("/admins")
    public ResponseEntity<CollegeAdminCreationResponse> createCollegeAdmin(
            @Valid @RequestBody CollegeAdminCreationRequest request) {

        CollegeAdminCreationResponse response = collegeAdminService.createCollegeAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
