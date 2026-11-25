package com.campusq.controller;

import com.campusq.dto.request.ComplaintCreateRequest;
import com.campusq.dto.response.ComplaintResponse;
import com.campusq.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> submitComplaint(
            @Valid @RequestBody ComplaintCreateRequest request,
            Authentication authentication) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(complaintService.submitComplaint(authentication.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getMyComplaints(authentication.getName()));
    }
}
