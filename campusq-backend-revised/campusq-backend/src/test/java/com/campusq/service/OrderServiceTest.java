package com.campusq.service;

import com.campusq.dto.request.OrderItemRequest;
import com.campusq.dto.request.OrderRequest;
import com.campusq.dto.response.OrderResponse;
import com.campusq.entity.AppUser;
import com.campusq.entity.College;
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
import com.campusq.repository.CustomerOrderRepository;
import com.campusq.repository.ProductRepository;
import com.campusq.repository.TokenSequenceRepository;
import com.campusq.repository.UserRepository;
import com.campusq.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CustomerOrderRepository customerOrderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private TokenSequenceRepository tokenSequenceRepository;
    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private OrderService orderService;

    private College mvit;
    private AppUser student;
    private AppUser vendorUser;
    private Vendor vendor;

    @BeforeEach
    void setUp() throws Exception {
        mvit = new College();
        setId(mvit, 1L);
        mvit.setCollegeCode("MVIT");
        mvit.setCollegeName("Sir M. Visvesvaraya Institute of Technology");
        mvit.setActive(true);

        student = new AppUser();
        setId(student, 10L);
        student.setFullName("Aarav Sharma");
        student.setEmail("student@mvit.edu");
        student.setRole(Role.STUDENT);
        student.setCollege(mvit);

        vendorUser = new AppUser();
        setId(vendorUser, 20L);
        vendorUser.setFullName("Ramesh");
        vendorUser.setEmail("vendor@mvit.edu");
        vendorUser.setRole(Role.VENDOR);
        vendorUser.setCollege(mvit);

        vendor = new Vendor();
        setId(vendor, 100L);
        vendor.setUser(vendorUser);
        vendor.setShopName("MVIT Canteen");
        vendor.setApprovalStatus(VendorStatus.APPROVED);
        vendor.setAvailable(true);
    }

    @Test
    void placeOrder_shouldRejectDuplicateProductIdsExceedingStock() throws Exception {
        Product samosa = new Product();
        setId(samosa, 50L);
        samosa.setVendor(vendor);
        samosa.setName("Samosa");
        samosa.setPrice(new BigDecimal("15.00"));
        samosa.setStockQuantity(5);
        samosa.setAvailable(true);

        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(50L);
        item1.setQuantity(3);

        OrderItemRequest item2 = new OrderItemRequest();
        item2.setProductId(50L);
        item2.setQuantity(3);

        OrderRequest request = new OrderRequest();
        request.setVendorId(100L);
        request.setItems(List.of(item1, item2));

        when(userRepository.findByEmail("student@mvit.edu")).thenReturn(Optional.of(student));
        when(vendorRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(vendor));
        when(productRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(samosa));

        assertThrows(ConflictException.class, () -> orderService.placeOrder("student@mvit.edu", request));
        assertEquals(5, samosa.getStockQuantity());
        verify(customerOrderRepository, never()).save(any());
    }

    @Test
    void placeOrder_shouldHandlePhysicalAndNullableServiceStockAndGenerateToken() throws Exception {
        Product samosa = new Product();
        setId(samosa, 50L);
        samosa.setVendor(vendor);
        samosa.setName("Samosa");
        samosa.setPrice(new BigDecimal("15.00"));
        samosa.setStockQuantity(10);
        samosa.setAvailable(true);

        Product photocopy = new Product();
        setId(photocopy, 51L);
        photocopy.setVendor(vendor);
        photocopy.setName("A4 Xerox");
        photocopy.setPrice(new BigDecimal("2.00"));
        photocopy.setStockQuantity(null);
        photocopy.setAvailable(true);

        OrderItemRequest item1 = new OrderItemRequest();
        item1.setProductId(50L);
        item1.setQuantity(2);

        OrderItemRequest item2 = new OrderItemRequest();
        item2.setProductId(51L);
        item2.setQuantity(5);

        OrderRequest request = new OrderRequest();
        request.setVendorId(100L);
        request.setItems(List.of(item1, item2));

        when(userRepository.findByEmail("student@mvit.edu")).thenReturn(Optional.of(student));
        when(vendorRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(vendor));
        when(productRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(samosa));
        when(productRepository.findByIdForUpdate(51L)).thenReturn(Optional.of(photocopy));
        when(tokenSequenceRepository.findByVendorAndDateForUpdate(eq(100L), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(tokenSequenceRepository.save(any(TokenSequence.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(customerOrderRepository.save(any(CustomerOrder.class)))
                .thenAnswer(inv -> {
                    CustomerOrder o = inv.getArgument(0);
                    setId(o, 500L);
                    return o;
                });

        OrderResponse response = orderService.placeOrder("student@mvit.edu", request);

        assertEquals(500L, response.getOrderId());
        assertEquals(1, response.getTokenNumber());
        assertEquals(new BigDecimal("40.00"), response.getTotalAmount());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(8, samosa.getStockQuantity());
        assertNull(photocopy.getStockQuantity());
    }

    @Test
    void placeOrder_shouldRejectCrossCollegeVendor() throws Exception {
        College otherCollege = new College();
        setId(otherCollege, 2L);
        otherCollege.setCollegeCode("BMSIT");
        vendorUser.setCollege(otherCollege);

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(50L);
        item.setQuantity(1);

        OrderRequest request = new OrderRequest();
        request.setVendorId(100L);
        request.setItems(List.of(item));

        when(userRepository.findByEmail("student@mvit.edu")).thenReturn(Optional.of(student));
        when(vendorRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(vendor));

        assertThrows(ForbiddenException.class, () -> orderService.placeOrder("student@mvit.edu", request));
    }

    @Test
    void updateOrderStatus_vendorCancellationShouldRestoreStock() throws Exception {
        Product samosa = new Product();
        setId(samosa, 50L);
        samosa.setVendor(vendor);
        samosa.setName("Samosa");
        samosa.setPrice(new BigDecimal("15.00"));
        samosa.setStockQuantity(8);

        CustomerOrder order = new CustomerOrder();
        setId(order, 500L);
        order.setStudent(student);
        order.setVendor(vendor);
        order.setStatus(OrderStatus.PREPARING);
        order.setTotalAmount(new BigDecimal("30.00"));
        order.setTokenNumber(1);
        order.setTokenDate(LocalDate.now());

        OrderItem item = new OrderItem();
        item.setProduct(samosa);
        item.setProductName("Samosa");
        item.setUnitPrice(new BigDecimal("15.00"));
        item.setQuantity(2);
        item.setSubtotal(new BigDecimal("30.00"));
        order.addOrderItem(item);

        when(userRepository.findByEmail("vendor@mvit.edu")).thenReturn(Optional.of(vendorUser));
        when(vendorRepository.findByUserId(20L)).thenReturn(Optional.of(vendor));
        when(customerOrderRepository.findByIdForUpdate(500L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdateIncludingDeleted(50L)).thenReturn(Optional.of(samosa));
        when(customerOrderRepository.save(any(CustomerOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(500L, "vendor@mvit.edu", OrderStatus.CANCELLED);

        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(10, samosa.getStockQuantity());
    }

    @Test
    void cancelOrder_studentCancellationShouldRestoreStockEvenForSoftDeletedProduct() throws Exception {
        Product deletedProduct = new Product();
        setId(deletedProduct, 50L);
        deletedProduct.setVendor(vendor);
        deletedProduct.setName("Old Snack");
        deletedProduct.setPrice(new BigDecimal("20.00"));
        deletedProduct.setStockQuantity(3);
        deletedProduct.setDeleted(true);

        CustomerOrder order = new CustomerOrder();
        setId(order, 501L);
        order.setStudent(student);
        order.setVendor(vendor);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(new BigDecimal("40.00"));
        order.setTokenNumber(2);
        order.setTokenDate(LocalDate.now());

        OrderItem item = new OrderItem();
        item.setProduct(deletedProduct);
        item.setProductName("Old Snack");
        item.setUnitPrice(new BigDecimal("20.00"));
        item.setQuantity(2);
        item.setSubtotal(new BigDecimal("40.00"));
        order.addOrderItem(item);

        when(customerOrderRepository.findByIdForUpdate(501L)).thenReturn(Optional.of(order));
        when(productRepository.findByIdForUpdateIncludingDeleted(50L))
                .thenReturn(Optional.of(deletedProduct));
        when(customerOrderRepository.save(any(CustomerOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.cancelOrder(501L, "student@mvit.edu");

        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(5, deletedProduct.getStockQuantity());
    }

    @Test
    void updateOrderStatus_shouldRejectInvalidTransition() throws Exception {
        CustomerOrder order = new CustomerOrder();
        setId(order, 502L);
        order.setStudent(student);
        order.setVendor(vendor);
        order.setStatus(OrderStatus.PENDING);

        when(userRepository.findByEmail("vendor@mvit.edu")).thenReturn(Optional.of(vendorUser));
        when(vendorRepository.findByUserId(20L)).thenReturn(Optional.of(vendor));
        when(customerOrderRepository.findByIdForUpdate(502L)).thenReturn(Optional.of(order));

        assertThrows(
                BadRequestException.class,
                () -> orderService.updateOrderStatus(502L, "vendor@mvit.edu", OrderStatus.COMPLETED)
        );
    }

    private static void setId(Object entity, Long id) throws Exception {
        Field idField = entity.getClass().getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }
}
