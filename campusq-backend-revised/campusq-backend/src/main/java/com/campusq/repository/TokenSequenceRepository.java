
package com.campusq.repository;

import com.campusq.entity.TokenSequence;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface TokenSequenceRepository
        extends JpaRepository<TokenSequence, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT t FROM TokenSequence t
        WHERE t.vendor.id = :vendorId
        AND t.tokenDate = :tokenDate
    """)
    Optional<TokenSequence> findByVendorAndDateForUpdate(
            @Param("vendorId") Long vendorId,
            @Param("tokenDate") LocalDate tokenDate
    );
}

