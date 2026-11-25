package com.campusq.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class OrderRequest {

    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @Size(max = 500, message = "Special note cannot exceed 500 characters")
    private String specialNote;

    @Size(max = 255)
    private String xeroxFileName;

    @Size(max = 100)
    private String xeroxFileType;

    private String xeroxFileData;

    @Size(max = 1000)
    private String xeroxConfig;

    public OrderRequest() {
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getSpecialNote() {
        return specialNote;
    }

    public void setSpecialNote(String specialNote) {
        this.specialNote = specialNote;
    }

    public String getXeroxFileName() {
        return xeroxFileName;
    }

    public void setXeroxFileName(String xeroxFileName) {
        this.xeroxFileName = xeroxFileName;
    }

    public String getXeroxFileType() {
        return xeroxFileType;
    }

    public void setXeroxFileType(String xeroxFileType) {
        this.xeroxFileType = xeroxFileType;
    }

    public String getXeroxFileData() {
        return xeroxFileData;
    }

    public void setXeroxFileData(String xeroxFileData) {
        this.xeroxFileData = xeroxFileData;
    }

    public String getXeroxConfig() {
        return xeroxConfig;
    }

    public void setXeroxConfig(String xeroxConfig) {
        this.xeroxConfig = xeroxConfig;
    }
}
