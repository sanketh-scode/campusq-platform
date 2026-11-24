
package com.campusq.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "vendor_category_mapping",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {"vendor_id", "category_id"}
        )
    }
)
public class VendorCategoryMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private VendorCategory category;

    public VendorCategoryMapping() {
    }

    public VendorCategoryMapping(
            Vendor vendor,
            VendorCategory category) {
        this.vendor = vendor;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public VendorCategory getCategory() {
        return category;
    }

    public void setCategory(VendorCategory category) {
        this.category = category;
    }
}

