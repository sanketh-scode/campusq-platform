package com.campusq.dto.request;

import com.campusq.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ComplaintUpdateRequest {

    @NotNull(message = "Complaint status is required")
    private ComplaintStatus status;

    @Size(max = 1000, message = "Reply cannot exceed 1000 characters")
    private String adminReply;

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public String getAdminReply() {
        return adminReply;
    }

    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }
}
