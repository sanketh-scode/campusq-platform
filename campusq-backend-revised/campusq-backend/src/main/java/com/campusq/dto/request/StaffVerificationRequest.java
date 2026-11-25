package com.campusq.dto.request;

import jakarta.validation.constraints.NotNull;

public class StaffVerificationRequest {

    @NotNull(message = "isStaff decision is required")
    private Boolean isStaff;

    public Boolean getIsStaff() {
        return isStaff;
    }

    public void setIsStaff(Boolean isStaff) {
        this.isStaff = isStaff;
    }
}
