package com.campusq.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class GoogleCompleteRegistrationRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    @NotBlank(message = "College code is required")
    private String collegeCode;

    // STUDENT (default), STAFF, or VENDOR
    @NotBlank(message = "Role is required")
    private String role;

    // Required only when role == VENDOR
    private String shopName;
    private String description;
    private String location;
    private List<String> categories;
    private String customCategory;
    private String qrCodeImage;

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getCollegeCode() {
        return collegeCode;
    }

    public void setCollegeCode(String collegeCode) {
        this.collegeCode = collegeCode;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getShopName() {
        return shopName;
    }

    public void setShopName(String shopName) {
        this.shopName = shopName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public String getCustomCategory() {
        return customCategory;
    }

    public void setCustomCategory(String customCategory) {
        this.customCategory = customCategory;
    }

    public String getQrCodeImage() {
        return qrCodeImage;
    }

    public void setQrCodeImage(String qrCodeImage) {
        this.qrCodeImage = qrCodeImage;
    }
}
