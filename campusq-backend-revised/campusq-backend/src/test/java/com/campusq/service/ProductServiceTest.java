package com.campusq.service;

import com.campusq.dto.request.ProductUpdateRequest;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
import com.campusq.entity.Product;
import com.campusq.entity.Vendor;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.ForbiddenException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.ProductRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void updateProduct_shouldRejectSoftDeletedProduct() throws Exception {
        AppUser vendorUser = new AppUser();
        setId(vendorUser, 1L);
        vendorUser.setEmail("vendor@mvit.edu");
        vendorUser.setRole(Role.VENDOR);

        Vendor vendor = new Vendor();
        setId(vendor, 10L);
        vendor.setUser(vendorUser);
        vendor.setApprovalStatus(VendorStatus.APPROVED);

        ProductUpdateRequest request = new ProductUpdateRequest();
        request.setName("Updated Item");
        request.setPrice(new BigDecimal("25.00"));

        when(userRepository.findByEmail("vendor@mvit.edu")).thenReturn(Optional.of(vendorUser));
        when(vendorRepository.findByUserId(1L)).thenReturn(Optional.of(vendor));
        when(productRepository.findByIdAndDeletedFalse(99L)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> productService.updateProduct(99L, request, "vendor@mvit.edu")
        );
    }

    @Test
    void getProductsByVendor_shouldRejectCrossCollegeStudent() throws Exception {
        College mvit = new College();
        setId(mvit, 1L);
        College otherCollege = new College();
        setId(otherCollege, 2L);

        AppUser student = new AppUser();
        setId(student, 5L);
        student.setEmail("student@mvit.edu");
        student.setRole(Role.STUDENT);
        student.setCollege(mvit);

        AppUser otherVendorUser = new AppUser();
        setId(otherVendorUser, 6L);
        otherVendorUser.setCollege(otherCollege);

        Vendor otherVendor = new Vendor();
        setId(otherVendor, 20L);
        otherVendor.setUser(otherVendorUser);
        otherVendor.setApprovalStatus(VendorStatus.APPROVED);
        otherVendor.setAvailable(true);

        when(userRepository.findByEmail("student@mvit.edu")).thenReturn(Optional.of(student));
        when(vendorRepository.findById(20L)).thenReturn(Optional.of(otherVendor));

        assertThrows(
                ForbiddenException.class,
                () -> productService.getProductsByVendor(20L, "student@mvit.edu")
        );
    }

    @Test
    void deleteProduct_shouldRejectAnotherVendorsProduct() throws Exception {
        AppUser vendorUser = new AppUser();
        setId(vendorUser, 1L);
        vendorUser.setEmail("vendor@mvit.edu");
        vendorUser.setRole(Role.VENDOR);

        Vendor vendor1 = new Vendor();
        setId(vendor1, 10L);
        vendor1.setUser(vendorUser);
        vendor1.setApprovalStatus(VendorStatus.APPROVED);

        Vendor vendor2 = new Vendor();
        setId(vendor2, 20L);

        Product product = new Product();
        setId(product, 50L);
        product.setVendor(vendor2);

        when(userRepository.findByEmail("vendor@mvit.edu")).thenReturn(Optional.of(vendorUser));
        when(vendorRepository.findByUserId(1L)).thenReturn(Optional.of(vendor1));
        when(productRepository.findByIdAndDeletedFalse(50L)).thenReturn(Optional.of(product));

        assertThrows(
                ForbiddenException.class,
                () -> productService.deleteProduct(50L, "vendor@mvit.edu")
        );
    }

    private static void setId(Object entity, Long id) throws Exception {
        Field idField = entity.getClass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }
}
