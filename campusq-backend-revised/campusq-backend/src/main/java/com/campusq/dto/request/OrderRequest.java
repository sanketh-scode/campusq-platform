
package com.campusq.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class OrderRequest {

    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

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
}
