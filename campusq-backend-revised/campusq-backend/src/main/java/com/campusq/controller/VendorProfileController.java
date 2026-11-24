package com.campusq.controller;

import com.campusq.dto.request.VendorProfileUpdateRequest;
import com.campusq.dto.response.VendorSummaryResponse;
import com.campusq.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor/profile")
public class VendorProfileController {

    private final VendorService vendorService;

    public VendorProfileController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public ResponseEntity<VendorSummaryResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(vendorService.getMyVendorProfile(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<VendorSummaryResponse> updateMyProfile(
            @Valid @RequestBody VendorProfileUpdateRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                vendorService.updateMyVendorProfile(authentication.getName(), request)
        );
    }
}
