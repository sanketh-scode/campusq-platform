package com.campusq.controller;

import com.campusq.dto.request.CollegeAdminCreationRequest;
import com.campusq.dto.request.CollegeAdminUpdateRequest;
import com.campusq.dto.request.CollegeCreateRequest;
import com.campusq.dto.request.CollegeUpdateRequest;
import com.campusq.dto.response.CollegeAdminCreationResponse;
import com.campusq.dto.response.CollegeResponse;
import com.campusq.service.CollegeAdminService;
import com.campusq.service.CollegeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(collegeService.createCollege(request));
    }

    @GetMapping("/colleges")
    public ResponseEntity<List<CollegeResponse>> getAllColleges() {
        return ResponseEntity.ok(collegeService.getAllColleges());
    }

    @PutMapping("/colleges/{collegeId}")
    public ResponseEntity<CollegeResponse> updateCollege(
            @PathVariable Long collegeId,
            @Valid @RequestBody CollegeUpdateRequest request) {
        return ResponseEntity.ok(collegeService.updateCollege(collegeId, request));
    }

    @PostMapping("/admins")
    public ResponseEntity<CollegeAdminCreationResponse> createCollegeAdmin(
            @Valid @RequestBody CollegeAdminCreationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(collegeAdminService.createCollegeAdmin(request));
    }

    @GetMapping("/admins")
    public ResponseEntity<List<CollegeAdminCreationResponse>> getAllCollegeAdmins() {
        return ResponseEntity.ok(collegeAdminService.getAllCollegeAdmins());
    }

    @PutMapping("/admins/{adminId}")
    public ResponseEntity<CollegeAdminCreationResponse> updateCollegeAdmin(
            @PathVariable Long adminId,
            @Valid @RequestBody CollegeAdminUpdateRequest request) {
        return ResponseEntity.ok(collegeAdminService.updateCollegeAdmin(adminId, request));
    }

    @DeleteMapping("/admins/{adminId}")
    public ResponseEntity<Void> deactivateCollegeAdmin(@PathVariable Long adminId) {
        collegeAdminService.deactivateCollegeAdmin(adminId);
        return ResponseEntity.noContent().build();
    }
}
