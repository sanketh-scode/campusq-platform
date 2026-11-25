package com.campusq.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class VendorProfileUpdateRequest {

    @NotBlank(message = "Shop name is required")
    @Size(max = 150, message = "Shop name cannot exceed 150 characters")
    private String shopName;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotBlank(message = "Shop location is required")
    @Size(max = 200, message = "Shop location cannot exceed 200 characters")
    private String location;

    @NotNull(message = "Availability status is required")
    private Boolean available;

    private List<@NotBlank(message = "Category name cannot be blank") String> categories;

    @Size(max = 100, message = "Custom category cannot exceed 100 characters")
    private String customCategory;

    private String qrCodeImage;

    public VendorProfileUpdateRequest() {
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

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
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
