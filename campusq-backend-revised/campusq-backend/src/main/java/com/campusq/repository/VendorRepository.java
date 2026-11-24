package com.campusq.repository;

import com.campusq.entity.Vendor;
import com.campusq.enums.VendorStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    Optional<Vendor> findByUserId(Long userId);

    List<Vendor> findByApprovalStatus(VendorStatus approvalStatus);

    List<Vendor> findByApprovalStatusAndAvailableTrue(VendorStatus approvalStatus);

    List<Vendor> findByUserCollegeId(Long collegeId);

    List<Vendor> findByUserCollegeIdAndApprovalStatus(
            Long collegeId,
            VendorStatus approvalStatus
    );

    List<Vendor> findByUserCollegeIdAndApprovalStatusAndAvailableTrue(
            Long collegeId,
            VendorStatus approvalStatus
    );

    Optional<Vendor> findByIdAndUserCollegeId(
            Long vendorId,
            Long collegeId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Vendor v WHERE v.id = :vendorId")
    Optional<Vendor> findByIdForUpdate(@Param("vendorId") Long vendorId);
}
