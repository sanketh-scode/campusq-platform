package com.campusq.dto.response;

import com.campusq.enums.VendorStatus;
import java.util.List;

public class VendorRegistrationResponse {

    private Long vendorId;
    private String shopName;
    private String location;
    private VendorStatus approvalStatus;
    private List<String> categories;
    private String collegeCode;

    public VendorRegistrationResponse() {
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String getShopName() {
        return shopName;
    }

    public void setShopName(String shopName) {
        this.shopName = shopName;
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