package com.campusq.controller;

import com.campusq.dto.request.OrderPaymentRequest;
import com.campusq.dto.request.OrderRequest;
import com.campusq.dto.request.OrderStatusUpdateRequest;
import com.campusq.dto.request.StaffVerificationRequest;
import com.campusq.dto.response.OrderResponse;
import com.campusq.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {

        OrderResponse response = orderService.placeOrder(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName()));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getMyOrderById(
            @PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(
                orderService.getMyOrderById(orderId, authentication.getName())
        );
    }

    @PutMapping("/{orderId}/pay")
    public ResponseEntity<OrderResponse> submitPayment(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderPaymentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                orderService.submitPayment(orderId, authentication.getName(), request)
        );
    }

    @PutMapping("/{orderId}/complete")
    public ResponseEntity<OrderResponse> completeOrderByStudent(
            @PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(
                orderService.completeOrderByStudent(orderId, authentication.getName())
        );
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(
                orderService.cancelOrder(orderId, authentication.getName())
        );
    }

    @GetMapping("/vendor/orders")
    public ResponseEntity<List<OrderResponse>> getVendorOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getVendorOrders(authentication.getName()));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            Authentication authentication) {

        OrderResponse response = orderService.updateOrderStatus(
                orderId,
                authentication.getName(),
                request.getStatus()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/vendor/verify-staff/{studentId}")
    public ResponseEntity<Map<String, String>> verifyStaffMember(
            @PathVariable Long studentId,
            @Valid @RequestBody StaffVerificationRequest request,
            Authentication authentication) {

        String message = orderService.verifyStaffMember(
                studentId,
                authentication.getName(),
                request.getIsStaff()
        );
        return ResponseEntity.ok(Map.of("message", message));
    }
}
