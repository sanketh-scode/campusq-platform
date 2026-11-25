package com.campusq.entity;

import com.campusq.enums.VendorStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "vendors",
    indexes = {
        @Index(name = "idx_vendors_status_available", columnList = "approval_status, available")
    }
)
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        unique = true
    )
    private AppUser user;

    @Column(nullable = false)
    private String shopName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String location;

    @Column(length = 100)
    private String customCategory;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String qrCodeImage;
    @Column(columnDefinition = "MEDIUMTEXT")
    private String shopImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    private VendorStatus approvalStatus = VendorStatus.PENDING;

    @Column(nullable = false)
    private boolean available = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Vendor() {
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
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

    public String getShopImage() {
        return shopImage;
    }

    public void setShopImage(String shopImage) {
        this.shopImage = shopImage;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
