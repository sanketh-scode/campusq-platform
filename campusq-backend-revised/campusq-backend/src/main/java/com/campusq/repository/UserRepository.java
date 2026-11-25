package com.campusq.repository;

import com.campusq.entity.AppUser;
import com.campusq.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    List<AppUser> findByRoleOrderByCreatedAtDesc(Role role);

    List<AppUser> findByCollegeIdAndRole(Long collegeId, Role role);
}
