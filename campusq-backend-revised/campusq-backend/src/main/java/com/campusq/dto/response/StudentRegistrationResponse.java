package com.campusq.dto.response;

import com.campusq.enums.Role;
import java.time.LocalDateTime;

public class StudentRegistrationResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
    private String collegeCode;

    public StudentRegistrationResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public String getCollegeCode() {
    return collegeCode;
}

    public void setCollegeCode(String collegeCode) {
        this.collegeCode = collegeCode;
    }
}
