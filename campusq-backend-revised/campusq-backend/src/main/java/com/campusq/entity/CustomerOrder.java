package com.campusq.entity;

import com.campusq.enums.OrderStatus;
import com.campusq.enums.PaymentMethod;
import com.campusq.enums.PaymentStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "customer_orders",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_vendor_daily_token",
            columnNames = {
                "vendor_id",
                "token_date",
                "token_number"
            }
        )
    },
    indexes = {
        @Index(name = "idx_orders_student_created", columnList = "student_id, created_at"),
        @Index(name = "idx_orders_vendor_status_created", columnList = "vendor_id, status, created_at")
    }
)
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private AppUser student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "token_number", nullable = false)
    private Integer tokenNumber;

    @Column(name = "token_date", nullable = false)
    private LocalDate tokenDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "VARCHAR(30)")
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, columnDefinition = "VARCHAR(30)")
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "VARCHAR(30)")
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(length = 120)
    private String paymentReference;

    @Column(nullable = false)
    private boolean staffOrder = false;

    @Column(length = 500)
    private String specialNote;

    @Column(length = 255)
    private String xeroxFileName;

    @Column(length = 100)
    private String xeroxFileType;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String xeroxFileData;

    @Column(length = 1000)
    private String xeroxConfig;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<OrderItem> orderItems = new ArrayList<>();

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

    public CustomerOrder() {
    }

    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }

    public Long getId() {
        return id;
    }

    public AppUser getStudent() {
        return student;
    }

    public void setStudent(AppUser student) {
        this.student = student;
    }

    public Vendor getVendor() {
        return vendor;
    }

    public void setVendor(Vendor vendor) {
        this.vendor = vendor;
    }

    public Integer getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(Integer tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public LocalDate getTokenDate() {
        return tokenDate;
    }

    public void setTokenDate(LocalDate tokenDate) {
        this.tokenDate = tokenDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public boolean isStaffOrder() {
        return staffOrder;
    }

    public void setStaffOrder(boolean staffOrder) {
        this.staffOrder = staffOrder;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
}
