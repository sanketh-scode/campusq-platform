package com.campusq.controller;

import com.campusq.dto.response.ProductResponse;
import com.campusq.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class StudentProductController {

    private final ProductService productService;

    public StudentProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(
            @RequestParam(required = false) String search,
            Authentication authentication) {
        return ResponseEntity.ok(
                productService.getProductsForStudent(authentication.getName(), search)
        );
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<ProductResponse>> getProductsByVendor(
            @PathVariable Long vendorId,
            Authentication authentication) {
        return ResponseEntity.ok(
                productService.getProductsByVendor(vendorId, authentication.getName())
        );
    }
}
