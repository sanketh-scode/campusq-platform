
package com.campusq.controller;

import com.campusq.dto.response.ProductResponse;
import com.campusq.service.ProductService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class StudentProductController {

    private final ProductService productService;

    public StudentProductController(ProductService productService) {
        this.productService = productService;
    }

    // Browse all available products in student's college
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(
            Authentication authentication) {

        return ResponseEntity.ok(
                productService.getProductsForStudent(
                        authentication.getName()
                )
        );
    }

    // Browse products from a particular vendor
    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<ProductResponse>> getProductsByVendor(
            @PathVariable Long vendorId,
            Authentication authentication) {

        return ResponseEntity.ok(
                productService.getProductsByVendor(
                        vendorId,
                        authentication.getName()
                )
        );
    }
}
