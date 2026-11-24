package com.campusq.repository;

import com.campusq.entity.CustomerOrder;
import com.campusq.enums.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByStudentId(Long studentId);

    List<CustomerOrder> findByStudentEmailOrderByCreatedAtDesc(String email);

    List<CustomerOrder> findByVendorId(Long vendorId);

    List<CustomerOrder> findByVendorUserEmailOrderByCreatedAtDesc(String email);

    List<CustomerOrder> findByVendorIdAndStatus(Long vendorId, OrderStatus status);

    List<CustomerOrder> findByVendorIdAndTokenDateOrderByTokenNumberAsc(
            Long vendorId,
            LocalDate tokenDate
    );

    Optional<CustomerOrder> findByIdAndStudentEmail(Long orderId, String studentEmail);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM CustomerOrder o WHERE o.id = :orderId")
    Optional<CustomerOrder> findByIdForUpdate(@Param("orderId") Long orderId);
}
