
package com.campusq.controller;

import com.campusq.dto.request.ProductRequest;
import com.campusq.dto.request.ProductUpdateRequest;
import com.campusq.dto.response.ProductResponse;
import com.campusq.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/vendor/products")
public class VendorProductController {

    private final ProductService productService;

    public VendorProductController(ProductService productService) {
        this.productService = productService;
    }

    // Add a new product
    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(
            @Valid @RequestBody ProductRequest request,
            Authentication authentication) {

        ProductResponse response = productService.addProduct(
                request,
                authentication.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // View products belonging to logged-in vendor
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getMyProducts(
            Authentication authentication) {

        return ResponseEntity.ok(
                productService.getMyProducts(
                        authentication.getName()
                )
        );
    }
    @PutMapping("/{productId}")
public ResponseEntity<ProductResponse> updateProduct(
        @PathVariable Long productId,
        @Valid @RequestBody ProductUpdateRequest request,
        Authentication authentication) {

    ProductResponse response = productService.updateProduct(
            productId,
            request,
            authentication.getName()
    );

    return ResponseEntity.ok(response);
}
@PatchMapping("/{productId}/availability")
public ResponseEntity<ProductResponse> updateProductAvailability(
        @PathVariable Long productId,
        @RequestParam boolean available,
        Authentication authentication) {

    ProductResponse response = productService.updateProductAvailability(
            productId,
            available,
            authentication.getName()
    );

    return ResponseEntity.ok(response);
}
@DeleteMapping("/{productId}")
public ResponseEntity<Void> deleteProduct(
        @PathVariable Long productId,
        Authentication authentication) {

    productService.deleteProduct(
            productId,
            authentication.getName()
    );

    return ResponseEntity.noContent().build();
}
}
