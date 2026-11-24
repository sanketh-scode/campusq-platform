
package com.campusq.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "vendor_categories",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "name")
    }
)
public class VendorCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    public VendorCategory() {
    }

    public VendorCategory(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
