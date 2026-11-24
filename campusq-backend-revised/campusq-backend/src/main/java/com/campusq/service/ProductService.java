package com.campusq.service;

import com.campusq.dto.request.ProductRequest;
import com.campusq.dto.request.ProductUpdateRequest;
import com.campusq.dto.response.ProductResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.Product;
import com.campusq.entity.Vendor;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ForbiddenException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.ProductRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    public ProductService(
            ProductRepository productRepository,
            UserRepository userRepository,
            VendorRepository vendorRepository) {

        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
    }

    @Transactional
    public ProductResponse addProduct(ProductRequest request, String vendorEmail) {
        Vendor vendor = getApprovedVendor(vendorEmail);

        Product product = new Product();
        product.setVendor(vendor);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setAvailable(true);

        Product savedProduct = productRepository.save(product);
        return mapProductResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getMyProducts(String vendorEmail) {
        Vendor vendor = getApprovedVendor(vendorEmail);

        return productRepository
                .findByVendorIdAndDeletedFalse(vendor.getId())
                .stream()
                .map(this::mapProductResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForStudent(String studentEmail) {
        AppUser student = getStudent(studentEmail);

        return productRepository
                .findAvailableProductsByCollege(
                        student.getCollege().getId(),
                        VendorStatus.APPROVED
                )
                .stream()
                .map(this::mapProductResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByVendor(Long vendorId, String studentEmail) {
        AppUser student = getStudent(studentEmail);

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        if (vendor.getUser().getCollege() == null
                || !vendor.getUser().getCollege().getId().equals(student.getCollege().getId())) {
            throw new ForbiddenException("You cannot access products from another college's vendor");
        }

        if (vendor.getApprovalStatus() != VendorStatus.APPROVED || !vendor.isAvailable()) {
            throw new BadRequestException("Vendor is not approved or currently unavailable");
        }

        return productRepository
                .findAvailableProductsByVendorAndCollege(
                        vendorId,
                        student.getCollege().getId(),
                        VendorStatus.APPROVED
                )
                .stream()
                .map(this::mapProductResponse)
                .toList();
    }

    @Transactional
    public ProductResponse updateProduct(
            Long productId,
            ProductUpdateRequest request,
            String vendorEmail) {

        Vendor vendor = getApprovedVendor(vendorEmail);
        Product product = getOwnedActiveProduct(productId, vendor);

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());

        Product updatedProduct = productRepository.save(product);
        return mapProductResponse(updatedProduct);
    }

    @Transactional
    public ProductResponse updateProductAvailability(
            Long productId,
            boolean available,
            String vendorEmail) {

        Vendor vendor = getApprovedVendor(vendorEmail);
        Product product = getOwnedActiveProduct(productId, vendor);

        product.setAvailable(available);

        Product updatedProduct = productRepository.save(product);
        return mapProductResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long productId, String vendorEmail) {
        Vendor vendor = getApprovedVendor(vendorEmail);
        Product product = getOwnedActiveProduct(productId, vendor);

        product.setDeleted(true);
        product.setAvailable(false);

        productRepository.save(product);
    }

    private Product getOwnedActiveProduct(Long productId, Vendor vendor) {
        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getVendor().getId().equals(vendor.getId())) {
            throw new ForbiddenException("You cannot modify another vendor's product");
        }

        return product;
    }

    private Vendor getApprovedVendor(String vendorEmail) {
        AppUser user = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found"));

        if (user.getRole() != Role.VENDOR) {
            throw new ForbiddenException("Only vendors can manage products");
        }

        Vendor vendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found"));

        if (vendor.getApprovalStatus() != VendorStatus.APPROVED) {
            throw new ForbiddenException("Your shop is not approved yet");
        }

        return vendor;
    }

    private AppUser getStudent(String studentEmail) {
        AppUser student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student account not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can browse products");
        }

        if (student.getCollege() == null) {
            throw new BadRequestException("Student is not assigned to a college");
        }

        return student;
    }

    private ProductResponse mapProductResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setStockQuantity(product.getStockQuantity());
        response.setAvailable(product.isAvailable());
        response.setVendorId(product.getVendor().getId());
        response.setVendorName(product.getVendor().getShopName());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        return response;
    }
}
