package com.campusq.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CollegeUpdateRequest {

    @NotBlank(message = "College name is required")
    @Size(max = 200, message = "College name cannot exceed 200 characters")
    private String collegeName;

    @NotBlank(message = "College code is required")
    @Size(min = 2, max = 30, message = "College code must be between 2 and 30 characters")
    @Pattern(
            regexp = "^[A-Za-z0-9_-]+$",
            message = "College code can only contain letters, numbers, hyphens, and underscores"
    )
    private String collegeCode;

    @NotBlank(message = "College address is required")
    @Size(max = 300, message = "College address cannot exceed 300 characters")
    private String address;

    @NotNull(message = "Active status is required")
    private Boolean active;

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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
