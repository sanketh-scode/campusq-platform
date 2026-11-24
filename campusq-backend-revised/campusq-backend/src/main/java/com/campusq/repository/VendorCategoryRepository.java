
package com.campusq.repository;

import com.campusq.entity.VendorCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendorCategoryRepository
        extends JpaRepository<VendorCategory, Long> {

    Optional<VendorCategory> findByName(String name);

    boolean existsByName(String name);
}

