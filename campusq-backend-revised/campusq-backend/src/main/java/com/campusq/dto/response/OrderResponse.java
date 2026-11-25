package com.campusq.dto.response;

import com.campusq.enums.OrderStatus;
import com.campusq.enums.PaymentMethod;
import com.campusq.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {

    private Long orderId;
    private Integer tokenNumber;
    private LocalDate tokenDate;
    private Long vendorId;
    private String vendorName;
    private Long studentId;
    private String studentName;
    private boolean staffOrder;
    private boolean studentStaffVerified;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentReference;
    private String vendorQrCodeImage;
    private String specialNote;
    private String xeroxFileName;
    private String xeroxFileType;
    private String xeroxFileData;
    private String xeroxConfig;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;

    public OrderResponse() {
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
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

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public boolean isStaffOrder() {
        return staffOrder;
    }

    public void setStaffOrder(boolean staffOrder) {
        this.staffOrder = staffOrder;
    }

    public boolean isStudentStaffVerified() {
        return studentStaffVerified;
    }

    public void setStudentStaffVerified(boolean studentStaffVerified) {
        this.studentStaffVerified = studentStaffVerified;
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

    public String getVendorQrCodeImage() {
        return vendorQrCodeImage;
    }

    public void setVendorQrCodeImage(String vendorQrCodeImage) {
        this.vendorQrCodeImage = vendorQrCodeImage;
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

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }
}
