package com.campusq.repository;

import com.campusq.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollegeRepository extends JpaRepository<College, Long> {

    Optional<College> findByCollegeCode(String collegeCode);

    boolean existsByCollegeCode(String collegeCode);

    List<College> findAllByOrderByCollegeNameAsc();

    List<College> findByActiveTrueOrderByCollegeNameAsc();
}