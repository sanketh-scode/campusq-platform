package com.campusq.repository;

import com.campusq.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStudentEmailOrderByCreatedAtDesc(String email);

    List<Complaint> findByCollegeIdOrderByCreatedAtDesc(Long collegeId);

    Optional<Complaint> findByIdAndCollegeId(Long id, Long collegeId);
}
