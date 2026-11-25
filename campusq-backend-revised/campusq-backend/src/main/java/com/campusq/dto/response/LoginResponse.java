package com.campusq.dto.response;

public class LoginResponse {

    private String token;
    private String tokenType;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String collegeCode;
    private String collegeName;
    private boolean staffVerified;
    private String staffStatusNotice;
    private boolean needsRegistration;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCollegeCode() {
        return collegeCode;
    }

    public void setCollegeCode(String collegeCode) {
        this.collegeCode = collegeCode;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public boolean isStaffVerified() {
        return staffVerified;
    }

    public void setStaffVerified(boolean staffVerified) {
        this.staffVerified = staffVerified;
    }

    public String getStaffStatusNotice() {
        return staffStatusNotice;
    }

    public void setStaffStatusNotice(String staffStatusNotice) {
        this.staffStatusNotice = staffStatusNotice;
    }

    public boolean isNeedsRegistration() {
        return needsRegistration;
    }

    public void setNeedsRegistration(boolean needsRegistration) {
        this.needsRegistration = needsRegistration;
    }
}
