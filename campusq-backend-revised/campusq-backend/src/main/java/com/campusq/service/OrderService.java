package com.campusq.service;

import com.campusq.dto.request.OrderItemRequest;
import com.campusq.dto.request.OrderRequest;
import com.campusq.dto.response.OrderItemResponse;
import com.campusq.dto.response.OrderResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.CustomerOrder;
import com.campusq.entity.OrderItem;
import com.campusq.entity.Product;
import com.campusq.entity.TokenSequence;
import com.campusq.entity.Vendor;
import com.campusq.enums.OrderStatus;
import com.campusq.enums.Role;
import com.campusq.enums.VendorStatus;
import com.campusq.exception.BadRequestException;
import com.campusq.exception.ConflictException;
import com.campusq.exception.ForbiddenException;
import com.campusq.exception.ResourceNotFoundException;
import com.campusq.repository.CustomerOrderRepository;
import com.campusq.repository.ProductRepository;
import com.campusq.repository.TokenSequenceRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class OrderService {

    private final UserRepository userRepository;
    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final TokenSequenceRepository tokenSequenceRepository;
    private final VendorRepository vendorRepository;

    public OrderService(
            UserRepository userRepository,
            CustomerOrderRepository customerOrderRepository,
            ProductRepository productRepository,
            TokenSequenceRepository tokenSequenceRepository,
            VendorRepository vendorRepository) {

        this.userRepository = userRepository;
        this.customerOrderRepository = customerOrderRepository;
        this.productRepository = productRepository;
        this.tokenSequenceRepository = tokenSequenceRepository;
        this.vendorRepository = vendorRepository;
    }

    @Transactional
    public OrderResponse placeOrder(String studentEmail, OrderRequest request) {
        AppUser student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student account not found"));

        // Lock vendor row first to serialize daily token initialization per vendor
        Vendor vendor = vendorRepository.findByIdForUpdate(request.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));

        validateStudentAndVendor(student, vendor);

        // Combine duplicate product IDs and sort ascending by ID to prevent lock deadlocks
        Map<Long, Integer> combinedQuantities = aggregateItemQuantities(request.getItems());

        // Single-pass pessimistic lock + full validation before any stock deduction
        List<Product> lockedProducts = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : combinedQuantities.entrySet()) {
            Long productId = entry.getKey();
            int requestedQuantity = entry.getValue();

            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found or deleted: " + productId
                    ));

            if (!product.getVendor().getId().equals(vendor.getId())) {
                throw new BadRequestException(
                        "Product '" + product.getName() + "' does not belong to the selected vendor"
                );
            }

            if (!product.isAvailable()) {
                throw new BadRequestException(product.getName() + " is currently unavailable");
            }

            if (product.getStockQuantity() != null && product.getStockQuantity() < requestedQuantity) {
                throw new ConflictException(
                        "Insufficient stock for " + product.getName()
                                + ". Requested: " + requestedQuantity
                                + ", available: " + product.getStockQuantity()
                );
            }

            BigDecimal subtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(requestedQuantity));
            totalAmount = totalAmount.add(subtotal);
            lockedProducts.add(product);
        }

        // All items validated: generate token, deduct stock, and build order
        LocalDate today = LocalDate.now();
        Integer tokenNumber = generateDailyToken(vendor, today);

        CustomerOrder order = new CustomerOrder();
        order.setStudent(student);
        order.setVendor(vendor);
        order.setTokenNumber(tokenNumber);
        order.setTokenDate(today);
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING);

        for (Product product : lockedProducts) {
            int quantity = combinedQuantities.get(product.getId());

            if (product.getStockQuantity() != null) {
                int remainingStock = product.getStockQuantity() - quantity;
                if (remainingStock < 0) {
                    throw new ConflictException("Insufficient stock for " + product.getName());
                }
                product.setStockQuantity(remainingStock);
                productRepository.save(product);
            }

            BigDecimal subtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(quantity));

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setQuantity(quantity);
            orderItem.setSubtotal(subtotal);

            order.addOrderItem(orderItem);
        }

        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return mapOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String studentEmail) {
        AppUser student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student account not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can view their orders");
        }

        return customerOrderRepository
                .findByStudentEmailOrderByCreatedAtDesc(studentEmail)
                .stream()
                .map(this::mapOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrderById(Long orderId, String studentEmail) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getStudent().getEmail().equals(studentEmail)) {
            throw new ForbiddenException("You cannot access another student's order");
        }

        return mapOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getVendorOrders(String vendorEmail) {
        Vendor vendor = getApprovedVendorForOrders(vendorEmail);

        return customerOrderRepository
                .findByVendorUserEmailOrderByCreatedAtDesc(vendor.getUser().getEmail())
                .stream()
                .map(this::mapOrderResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateOrderStatus(
            Long orderId,
            String vendorEmail,
            OrderStatus newStatus) {

        Vendor vendor = getApprovedVendorForOrders(vendorEmail);

        // Lock order row to prevent concurrent student cancellation / status update races
        CustomerOrder order = customerOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getVendor().getId().equals(vendor.getId())) {
            throw new ForbiddenException("You cannot update another vendor's order");
        }

        OrderStatus currentStatus = order.getStatus();

        boolean validTransition =
                (currentStatus == OrderStatus.PENDING
                        && (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.CANCELLED))
                || (currentStatus == OrderStatus.PREPARING
                        && (newStatus == OrderStatus.READY || newStatus == OrderStatus.CANCELLED))
                || (currentStatus == OrderStatus.READY
                        && newStatus == OrderStatus.COMPLETED);

        if (!validTransition) {
            throw new BadRequestException(
                    "Invalid order status transition: " + currentStatus + " to " + newStatus
            );
        }

        if (newStatus == OrderStatus.CANCELLED) {
            restoreStockForOrder(order);
        }

        order.setStatus(newStatus);
        CustomerOrder updatedOrder = customerOrderRepository.save(order);

        return mapOrderResponse(updatedOrder);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, String studentEmail) {
        // Lock order row to prevent concurrent vendor status updates during cancellation
        CustomerOrder order = customerOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getStudent().getEmail().equals(studentEmail)) {
            throw new ForbiddenException("You are not authorized to cancel another student's order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be cancelled by students");
        }

        restoreStockForOrder(order);

        order.setStatus(OrderStatus.CANCELLED);
        CustomerOrder cancelledOrder = customerOrderRepository.save(order);

        return mapOrderResponse(cancelledOrder);
    }

    private void validateStudentAndVendor(AppUser student, Vendor vendor) {
        if (student.getRole() != Role.STUDENT) {
            throw new ForbiddenException("Only students can place orders");
        }

        if (student.getCollege() == null) {
            throw new BadRequestException("Student is not assigned to a college");
        }

        if (vendor.getUser().getCollege() == null
                || !student.getCollege().getId().equals(vendor.getUser().getCollege().getId())) {
            throw new ForbiddenException("You cannot order from another college's vendor");
        }

        if (vendor.getApprovalStatus() != VendorStatus.APPROVED || !vendor.isAvailable()) {
            throw new BadRequestException("Vendor is not approved or currently unavailable");
        }
    }

    private Map<Long, Integer> aggregateItemQuantities(List<OrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        Map<Long, Integer> combined = new TreeMap<>();
        for (OrderItemRequest item : items) {
            if (item.getProductId() == null) {
                throw new BadRequestException("Product ID is required");
            }
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new BadRequestException("Quantity must be at least 1");
            }
            combined.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }
        return combined;
    }

    private Integer generateDailyToken(Vendor vendor, LocalDate today) {
        TokenSequence sequence = tokenSequenceRepository
                .findByVendorAndDateForUpdate(vendor.getId(), today)
                .orElseGet(() -> {
                    TokenSequence created = new TokenSequence();
                    created.setVendor(vendor);
                    created.setTokenDate(today);
                    created.setLastTokenNumber(0);
                    return created;
                });

        int nextToken = sequence.getLastTokenNumber() + 1;
        sequence.setLastTokenNumber(nextToken);
        tokenSequenceRepository.save(sequence);
        return nextToken;
    }

    private void restoreStockForOrder(CustomerOrder order) {
        Map<Long, Integer> quantitiesToRestore = new TreeMap<>();
        for (OrderItem item : order.getOrderItems()) {
            quantitiesToRestore.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
        }

        for (Map.Entry<Long, Integer> entry : quantitiesToRestore.entrySet()) {
            Product product = productRepository
                    .findByIdForUpdateIncludingDeleted(entry.getKey())
                    .orElse(null);

            if (product != null && product.getStockQuantity() != null) {
                product.setStockQuantity(product.getStockQuantity() + entry.getValue());
                productRepository.save(product);
            }
        }
    }

    private Vendor getApprovedVendorForOrders(String vendorEmail) {
        AppUser vendorUser = userRepository.findByEmail(vendorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found"));

        if (vendorUser.getRole() != Role.VENDOR) {
            throw new ForbiddenException("Only vendors can manage shop orders");
        }

        Vendor vendor = vendorRepository.findByUserId(vendorUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found"));

        if (vendor.getApprovalStatus() != VendorStatus.APPROVED) {
            throw new ForbiddenException("Vendor is not approved");
        }

        return vendor;
    }

    private OrderResponse mapOrderResponse(CustomerOrder order) {
        OrderResponse response = new OrderResponse();
        response.setOrderId(order.getId());
        response.setTokenNumber(order.getTokenNumber());
        response.setTokenDate(order.getTokenDate());
        response.setVendorId(order.getVendor().getId());
        response.setVendorName(order.getVendor().getShopName());
        response.setStudentName(order.getStudent().getFullName());
        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        List<OrderItemResponse> responseItems = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            OrderItemResponse itemResponse = new OrderItemResponse();
            itemResponse.setProductName(item.getProductName());
            itemResponse.setUnitPrice(item.getUnitPrice());
            itemResponse.setQuantity(item.getQuantity());
            itemResponse.setSubtotal(item.getSubtotal());
            responseItems.add(itemResponse);
        }

        response.setItems(responseItems);
        return response;
    }
}
