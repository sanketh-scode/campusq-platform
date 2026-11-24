package com.campusq.dto.response;

import com.campusq.enums.VendorStatus;
import java.util.List;

public class VendorApprovalResponse {

    private Long vendorId;
    private String ownerName;
    private String email;
    private String shopName;
    private String description;
    private String location;
    private VendorStatus approvalStatus;
    private boolean available;
    private List<String> categories;
    private String collegeCode;

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public VendorStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(VendorStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public String getCollegeCode() {
        return collegeCode;
    }

    public void setCollegeCode(String collegeCode) {
        this.collegeCode = collegeCode;
    }
}
