package com.campusq.repository;

import com.campusq.entity.Product;
import com.campusq.enums.VendorStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByVendorId(Long vendorId);

    List<Product> findByVendorIdAndAvailableTrue(Long vendorId);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByVendorIdAndDeletedFalse(Long vendorId);

    Optional<Product> findByIdAndDeletedFalse(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p FROM Product p
        WHERE p.id = :productId
        AND p.deleted = false
        """)
    Optional<Product> findByIdForUpdate(@Param("productId") Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :productId")
    Optional<Product> findByIdForUpdateIncludingDeleted(@Param("productId") Long productId);

    @Query("""
        SELECT p FROM Product p
        JOIN p.vendor v
        WHERE v.user.college.id = :collegeId
        AND v.approvalStatus = :status
        AND v.available = true
        AND p.available = true
        AND p.deleted = false
        """)
    List<Product> findAvailableProductsByCollege(
            @Param("collegeId") Long collegeId,
            @Param("status") VendorStatus status
    );

    @Query("""
        SELECT p FROM Product p
        JOIN p.vendor v
        WHERE v.id = :vendorId
        AND v.user.college.id = :collegeId
        AND v.approvalStatus = :status
        AND v.available = true
        AND p.available = true
        AND p.deleted = false
        """)
    List<Product> findAvailableProductsByVendorAndCollege(
            @Param("vendorId") Long vendorId,
            @Param("collegeId") Long collegeId,
            @Param("status") VendorStatus status
    );
}
