package com.campusq.repository;

import com.campusq.entity.VendorCategoryMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorCategoryMappingRepository
        extends JpaRepository<VendorCategoryMapping, Long> {

    List<VendorCategoryMapping> findByVendorId(Long vendorId);

    List<VendorCategoryMapping> findByCategoryId(Long categoryId);

    boolean existsByVendorIdAndCategoryId(Long vendorId, Long categoryId);

    void deleteByVendorId(Long vendorId);
}
