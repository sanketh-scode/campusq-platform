package com.campusq.controller;

import com.campusq.dto.request.VendorRegistrationRequest;
import com.campusq.dto.response.VendorRegistrationResponse;
import com.campusq.dto.response.VendorSummaryResponse;
import com.campusq.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @PostMapping("/register")
    public ResponseEntity<VendorRegistrationResponse> registerVendor(
            @Valid @RequestBody VendorRegistrationRequest request) {

        VendorRegistrationResponse response = vendorService.registerVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<VendorSummaryResponse>> browseCollegeVendors(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        return ResponseEntity.ok(
                vendorService.getAvailableVendorsForStudent(authentication.getName(), category, search)
        );
    }
}
