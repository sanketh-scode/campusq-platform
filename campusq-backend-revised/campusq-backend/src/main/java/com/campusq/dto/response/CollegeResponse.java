package com.campusq.dto.response;

import java.time.LocalDateTime;

public class CollegeResponse {

    private Long id;
    private String collegeName;
    private String collegeCode;
    private String address;
    private boolean active;
    private LocalDateTime createdAt;

    public CollegeResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public String getCollegeCode() {
        return collegeCode;
    }

    public void setCollegeCode(String collegeCode) {
        this.collegeCode = collegeCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
