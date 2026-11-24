package com.campusq.controller;

import com.campusq.dto.response.VendorApprovalResponse;
import com.campusq.service.VendorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final VendorService vendorService;

    public AdminController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<VendorApprovalResponse>> getAllVendors(
            Authentication authentication) {
        return ResponseEntity.ok(vendorService.getAllVendorsForAdmin(authentication.getName()));
    }

    @GetMapping("/vendors/pending")
    public ResponseEntity<List<VendorApprovalResponse>> getPendingVendors(
            Authentication authentication) {
        return ResponseEntity.ok(vendorService.getPendingVendors(authentication.getName()));
    }

    @GetMapping("/vendors/approved")
    public ResponseEntity<List<VendorApprovalResponse>> getApprovedVendors(
            Authentication authentication) {
        return ResponseEntity.ok(vendorService.getApprovedVendors(authentication.getName()));
    }

    @GetMapping("/vendors/{vendorId}")
    public ResponseEntity<VendorApprovalResponse> getVendorDetails(
            @PathVariable Long vendorId,
            Authentication authentication) {
        return ResponseEntity.ok(
                vendorService.getVendorDetailsForAdmin(vendorId, authentication.getName())
        );
    }

    @PutMapping("/vendors/{vendorId}/approve")
    public ResponseEntity<VendorApprovalResponse> approveVendor(
            @PathVariable Long vendorId,
            Authentication authentication) {
        return ResponseEntity.ok(
                vendorService.approveVendor(vendorId, authentication.getName())
        );
    }

    @PutMapping("/vendors/{vendorId}/reject")
    public ResponseEntity<VendorApprovalResponse> rejectVendor(
            @PathVariable Long vendorId,
            Authentication authentication) {
        return ResponseEntity.ok(
                vendorService.rejectVendor(vendorId, authentication.getName())
        );
    }
}
