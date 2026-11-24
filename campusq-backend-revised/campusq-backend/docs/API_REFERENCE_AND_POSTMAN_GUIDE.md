# CampusQ Backend — Complete Audit Report, Implementation Summary, API Reference & Postman Testing Guide

## 1. Phase 1: Full Project Inspection & Audit Report

### 1.1 Existing Architecture Overview
The uploaded `campusq-backend` project is a Spring Boot **4.2.0** (Java 21, Maven) REST API backed by MySQL 8, Spring Data JPA / Hibernate, Spring Security (stateless JWT via `jjwt 0.12.6`), and BCrypt password hashing. It uses a clean layered structure (`config`, `controller`, `dto/request`, `dto/response`, `entity`, `enums`, `exception`, `repository`, `service`).

### 1.2 Features Already Implemented in the Uploaded Codebase
- **Authentication**: `POST /api/auth/login` with JWT generation, `JwtAuthenticationFilter`, `CustomUserDetailsService`, and BCrypt encoding.
- **Data Initializers**: `SuperAdminInitializer` (env-based bootstrap), `CollegeInitializer` (seeds `MVIT`), `CategoryInitializer` (seeds `CANTEEN`, `XEROX`, `STATIONERY`).
- **Super Admin**: `POST /api/super-admin/admins` to create College Admins (`Role.ADMIN`).
- **College Admin**: `GET /api/admin/vendors/pending`, `PUT /api/admin/vendors/{vendorId}/approve`, `PUT /api/admin/vendors/{vendorId}/reject`.
- **Vendor**: `POST /api/vendors/register` (multi-category via `VendorCategoryMapping`), CRUD on `/api/vendor/products` (with soft delete), `GET /api/orders/vendor/orders`, and `PUT /api/orders/{orderId}/status`.
- **Student**: `POST /api/students/register`, `GET /api/products`, `GET /api/products/vendor/{vendorId}`, `POST /api/orders`, `GET /api/orders/my-orders`, `PUT /api/orders/{orderId}/cancel`.

### 1.3 Bugs, Concurrency Flaws & Security Weaknesses Identified
1. **Duplicate Product IDs Bypass Stock Check (Negative Stock Bug)**: In `OrderService.placeOrder`, each item in `request.getItems()` was validated independently against `product.getStockQuantity()`. Ordering `[{productId: 1, quantity: 4}, {productId: 1, quantity: 4}]` when stock is `5` passed validation and deducted `8`, resulting in `-3` stock.
2. **Vendor Cancellation Never Restored Stock**: `OrderService.updateOrderStatus` allowed `PENDING → CANCELLED` and `PREPARING → CANCELLED` without restoring product inventory.
3. **Soft-Deleted Product Broke Student Order Cancellation**: `OrderService.cancelOrder` called `productRepository.findByIdForUpdate` (which filtered `deleted = false`). If a vendor soft-deleted a product after an order was placed, the student could no longer cancel their `PENDING` order.
4. **Deadlock & Double-Locking Risk in `OrderService`**: Products were locked in arbitrary request order (risking circular deadlocks under concurrent multi-item orders), locked twice during `placeOrder`, and `CustomerOrder` rows were not locked during cancel/status transitions (allowing student cancel and vendor `PREPARING` to race).
5. **Missing `@Valid` on Super Admin Creation**: `SuperAdminController.createCollegeAdmin` omitted `@Valid`, allowing blank emails, short passwords, and empty college codes to bypass Jakarta Bean Validation.
6. **Hardcoded Credentials & Debug Logging**: `application.properties` contained a hardcoded `spring.datasource.password`, hardcoded DB URL/username, `spring.jpa.show-sql=true`, and `logging.level.org.springframework.security=DEBUG`. CORS origins were hardcoded in `SecurityConfig`.
7. **Broken Error Status Codes & Missing Handlers**: `GlobalExceptionHandler` caught all `RuntimeException`s and mapped them to `400 BAD REQUEST` (including `BadCredentialsException` login failures, duplicate conflicts, and unexpected errors), had no `MethodArgumentNotValidException` handler, and `SecurityConfig` lacked JSON `AuthenticationEntryPoint` (401) and `AccessDeniedHandler` (403) handlers.
8. **Soft-Deleted Product Editing & Vendor Lockout (`ProductService`)**: `updateProduct`, `updateProductAvailability`, and `deleteProduct` used `findById` without checking `deleted = false`. Ownership errors threw `RuntimeException` (400) instead of `ForbiddenException` (403). `getApprovedVendor` had a copy-paste `"Product not found"` message for missing users and blocked approved vendors from managing products/orders whenever they temporarily set `available = false`.
9. **Missing Email Normalization & Transaction**: Emails were not trimmed/lowercased across registration/login/bootstrap; `StudentService.registerStudent` lacked `@Transactional`.
10. **Silent Empty List on Cross-College Product Lookup**: `GET /api/products/vendor/{vendorId}` returned `200 OK []` for another college's vendor instead of explicitly rejecting cross-college access with `403 Forbidden`.

### 1.4 Missing Required Functionality Identified
- **Super Admin College Management**: `POST /api/super-admin/colleges`, `GET /api/super-admin/colleges`, and public `GET /api/colleges`.
- **College Admin**: Viewing approved vendors (`GET /api/admin/vendors/approved`), all college vendors (`GET /api/admin/vendors`), and single vendor details (`GET /api/admin/vendors/{vendorId}`).
- **Vendor**: Viewing and updating shop information (`GET /api/vendor/profile`, `PUT /api/vendor/profile`).
- **Student**: Browsing approved & available vendors in their own college (`GET /api/vendors` with optional `?category=`) and tracking a single order (`GET /api/orders/{orderId}`).
- **Entity Metadata & Indexing**: `updatedAt` timestamps on `Product`, `Vendor`, `CustomerOrder`; composite database indexes; safe entity default `Vendor.available = false`.

---

## 2. Phase 2 & 3: Prioritized Implementation Plan & Applied Changes

| Priority | Area | Change Applied | Files Modified / Added |
| :--- | :--- | :--- | :--- |
| P0 | Inventory & Concurrency | Aggregated duplicate `productId`s into sorted `TreeMap` (prevents negative stock & deadlocks), single-pass pessimistic locking (`Vendor` → `Product`s → `TokenSequence`), order row locking (`findByIdForUpdate`), stock restoration on vendor cancellation, soft-delete-safe stock restoration (`findByIdForUpdateIncludingDeleted`). | `OrderService.java`, `ProductRepository.java`, `CustomerOrderRepository.java` |
| P0 | Security & Config | Removed hardcoded DB password & DEBUG logging; externalized DB, JWT, CORS, and Super Admin settings to env vars; added startup 256-bit JWT key validation; added JSON 401/403 handlers; added `@Valid` on `createCollegeAdmin`; normalized emails. | `application.properties`, `application-prod.properties`, `.env.example`, `SecurityConfig.java`, `JwtService.java`, `AuthService.java`, `SuperAdminController.java`, `SuperAdminInitializer.java`, `CollegeAdminService.java`, `StudentService.java`, `VendorService.java` |
| P1 | Validation & Exceptions | Added `BadRequestException` (400) and `ConflictException` (409); overhauled `GlobalExceptionHandler` for 400/401/403/404/409/500 with structured `fieldErrors` and safe internal error logging without stack-trace leaks. | `BadRequestException.java`, `ConflictException.java`, `GlobalExceptionHandler.java`, `ProductRequest.java`, `ProductUpdateRequest.java` |
| P1 | Super Admin & Public Colleges | Implemented `CollegeService`, `CollegeController` (`GET /api/colleges`), and `POST/GET /api/super-admin/colleges` with uppercase code normalization and duplicate rejection (409). | `CollegeService.java`, `CollegeController.java`, `SuperAdminController.java`, `CollegeCreateRequest.java`, `CollegeResponse.java`, `PublicCollegeResponse.java`, `CollegeRepository.java` |
| P1 | Admin, Vendor & Student APIs | Added College Admin vendor views (`GET /vendors`, `/approved`, `/{vendorId}`), Vendor shop profile (`GET/PUT /api/vendor/profile`), Student vendor browsing (`GET /api/vendors?category=`), and single order tracking (`GET /api/orders/{orderId}`). | `AdminController.java`, `VendorController.java`, `VendorProfileController.java`, `OrderController.java`, `VendorService.java`, `VendorProfileUpdateRequest.java`, `VendorSummaryResponse.java`, `VendorApprovalResponse.java`, `OrderResponse.java` |
| P1 | Product & Data Integrity | Blocked edits/toggles on soft-deleted products (`findByIdAndDeletedFalse`), fixed ownership `ForbiddenException`, fixed cross-college 403 check on vendor products, allowed temporarily closed approved vendors to manage products/orders, added `updatedAt` and non-breaking `@Index` definitions. | `ProductService.java`, `Product.java`, `Vendor.java`, `AppUser.java`, `CustomerOrder.java`, `OrderItem.java`, `ProductResponse.java`, `VendorRepository.java`, `VendorCategoryMappingRepository.java` |
| P2 | Logging & Unit Tests | Replaced `System.out.println` with SLF4J in initializers; added JUnit 5 + Mockito unit test suites for core business & security rules. | `CategoryInitializer.java`, `CollegeInitializer.java`, `OrderServiceTest.java`, `CollegeServiceTest.java`, `VendorServiceTest.java`, `ProductServiceTest.java` |

---

## 3. Required Environment Variables

See `.env.example` in the project root (no real secrets included):

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `DB_URL` | No (prod: Yes) | `jdbc:mysql://localhost:3306/campusq_db?...` | MySQL 8 JDBC URL |
| `DB_USERNAME` | No (prod: Yes) | `root` | MySQL database username |
| `DB_PASSWORD` | **Yes** | *(none)* | MySQL database password |
| `JWT_SECRET` | **Yes** | *(none)* | Base64-encoded random key, ≥ 32 bytes (`openssl rand -base64 32`) |
| `JWT_EXPIRATION_MS` | No | `86400000` (24h) | JWT token lifetime in milliseconds |
| `CAMPUSQ_SUPER_ADMIN_EMAIL` | First run | *(empty)* | Super Admin bootstrap email |
| `CAMPUSQ_SUPER_ADMIN_PASSWORD` | First run | *(empty)* | Super Admin bootstrap password |
| `CORS_ALLOWED_ORIGINS` | No (prod: Yes) | `http://localhost:5173` | Comma-separated frontend origins |
| `SPRING_PROFILES_ACTIVE` | No | *(default)* | Set `prod` in production (`application-prod.properties`) |
| `JPA_DDL_AUTO` | No | `update` (`validate` in `prod`) | Hibernate schema strategy |

---

## 4. Complete API Reference

All protected endpoints require header: `Authorization: Bearer <jwt_token>`.

### Standard Error Response Format
```json
{
  "timestamp": "2026-11-24T16:40:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": {
    "email": "Enter a valid email"
  }
}
```
*(The `fieldErrors` key is included on `400` Bean Validation errors; omitted on other errors.)*

### 4.1 Public & Authentication Endpoints

#### 1. `GET /api/colleges`
- **Role**: Public (No Auth)
- **Success (`200 OK`)**:
```json
[
  {
    "id": 1,
    "collegeName": "Sir M. Visvesvaraya Institute of Technology",
    "collegeCode": "MVIT",
    "address": "Hunasamaranahalli, Bengaluru, Karnataka"
  }
]
```

#### 2. `POST /api/auth/login`
- **Role**: Public
- **Request**:
```json
{
  "email": "student@mvit.edu",
  "password": "Password@123"
}
```
- **Success (`200 OK`)**:
```json
{
  "token": "<jwt>",
  "tokenType": "Bearer",
  "userId": 5,
  "fullName": "Aarav Sharma",
  "email": "student@mvit.edu",
  "role": "STUDENT",
  "collegeCode": "MVIT"
}
```
- **Errors**: `400` validation failure, `401` invalid email or password.

#### 3. `POST /api/students/register`
- **Role**: Public
- **Request**:
```json
{
  "fullName": "Aarav Sharma",
  "email": "student@mvit.edu",
  "password": "Password@123",
  "collegeCode": "MVIT"
}
```
- **Success (`201 Created`)**:
```json
{
  "id": 5,
  "fullName": "Aarav Sharma",
  "email": "student@mvit.edu",
  "role": "STUDENT",
  "createdAt": "2026-11-24T16:45:00",
  "collegeCode": "MVIT"
}
```
- **Errors**: `400` invalid/inactive college code or validation error, `409` duplicate email.

#### 4. `POST /api/vendors/register`
- **Role**: Public
- **Request**:
```json
{
  "fullName": "Ramesh Kumar",
  "email": "canteen@mvit.edu",
  "password": "Password@123",
  "shopName": "MVIT Central Canteen",
  "description": "Fresh snacks and meals",
  "location": "Block A Ground Floor",
  "categories": ["CANTEEN"],
  "collegeCode": "MVIT"
}
```
- **Success (`201 Created`)**:
```json
{
  "vendorId": 1,
  "shopName": "MVIT Central Canteen",
  "location": "Block A Ground Floor",
  "approvalStatus": "PENDING",
  "categories": ["CANTEEN"],
  "collegeCode": "MVIT"
}
```
- **Errors**: `400` invalid college/category or duplicate category, `409` duplicate email.

---

### 4.2 Super Admin Endpoints (`ROLE_SUPER_ADMIN`)

#### 5. `POST /api/super-admin/colleges`
- **Request**:
```json
{
  "collegeName": "BMS Institute of Technology",
  "collegeCode": "BMSIT",
  "address": "Yelahanka, Bengaluru, Karnataka",
  "active": true
}
```
- **Success (`201 Created`)**:
```json
{
  "id": 2,
  "collegeName": "BMS Institute of Technology",
  "collegeCode": "BMSIT",
  "address": "Yelahanka, Bengaluru, Karnataka",
  "active": true,
  "createdAt": "2026-11-24T16:46:00"
}
```
- **Errors**: `400` validation error, `401` unauthenticated, `403` non-Super Admin, `409` duplicate college code.

#### 6. `GET /api/super-admin/colleges`
- **Success (`200 OK`)**: Array of `CollegeResponse`.
- **Errors**: `401`, `403`.

#### 7. `POST /api/super-admin/admins`
- **Request**:
```json
{
  "fullName": "MVIT College Admin",
  "email": "admin@mvit.edu",
  "password": "AdminPassword@123",
  "collegeCode": "MVIT"
}
```
- **Success (`201 Created`)**:
```json
{
  "id": 2,
  "fullName": "MVIT College Admin",
  "email": "admin@mvit.edu",
  "role": "ADMIN",
  "collegeName": "Sir M. Visvesvaraya Institute of Technology",
  "collegeCode": "MVIT",
  "createdAt": "2026-11-24T16:47:00"
}
```
- **Errors**: `400` validation error / invalid college code, `401`, `403`, `409` duplicate email.

---

### 4.3 College Admin Endpoints (`ROLE_ADMIN`)

#### 8. `GET /api/admin/vendors` (All vendors in admin's college)
#### 9. `GET /api/admin/vendors/pending` (Pending vendors in admin's college)
#### 10. `GET /api/admin/vendors/approved` (Approved vendors in admin's college)
#### 11. `GET /api/admin/vendors/{vendorId}` (Single vendor details in admin's college)
#### 12. `PUT /api/admin/vendors/{vendorId}/approve`
#### 13. `PUT /api/admin/vendors/{vendorId}/reject`
- **Success (`200 OK`)** (single item or array):
```json
{
  "vendorId": 1,
  "ownerName": "Ramesh Kumar",
  "email": "canteen@mvit.edu",
  "shopName": "MVIT Central Canteen",
  "description": "Fresh snacks and meals",
  "location": "Block A Ground Floor",
  "approvalStatus": "APPROVED",
  "available": true,
  "categories": ["CANTEEN"],
  "collegeCode": "MVIT"
}
```
- **Errors**: `401`, `403` (including attempting to view/approve/reject another college's vendor), `404` vendor not found, `409` vendor is not in `PENDING` state.

---

### 4.4 Vendor Endpoints (`ROLE_VENDOR`)

#### 14. `GET /api/vendor/profile`
- **Success (`200 OK`)**: `VendorSummaryResponse` (works even while `PENDING` so vendor can check approval status).

#### 15. `PUT /api/vendor/profile`
- **Request**:
```json
{
  "shopName": "MVIT Central Canteen",
  "description": "Updated menu and timings",
  "location": "Block A Ground Floor",
  "available": true,
  "categories": ["CANTEEN", "STATIONERY"]
}
```
- **Success (`200 OK`)**: Updated `VendorSummaryResponse`.
- **Errors**: `400` validation/category error, `403` vendor not yet approved.

#### 16. `POST /api/vendor/products`
- **Request** (`stockQuantity` may be `null` for services like Xerox):
```json
{
  "name": "Masala Dosa",
  "description": "Served with chutney and sambar",
  "price": 45.00,
  "stockQuantity": 20
}
```
- **Success (`201 Created`)**:
```json
{
  "id": 1,
  "name": "Masala Dosa",
  "description": "Served with chutney and sambar",
  "price": 45.00,
  "stockQuantity": 20,
  "available": true,
  "vendorId": 1,
  "vendorName": "MVIT Central Canteen",
  "createdAt": "2026-11-24T16:50:00",
  "updatedAt": "2026-11-24T16:50:00"
}
```
- **Errors**: `400` validation error, `403` unapproved vendor.

#### 17. `GET /api/vendor/products`
- **Success (`200 OK`)**: Array of active (non-deleted) `ProductResponse` belonging to logged-in vendor.

#### 18. `PUT /api/vendor/products/{productId}`
- **Request**: Same schema as `POST /api/vendor/products`.
- **Success (`200 OK`)**: Updated `ProductResponse`.
- **Errors**: `400`, `403` (another vendor's product), `404` (missing or soft-deleted).

#### 19. `PATCH /api/vendor/products/{productId}/availability?available=false`
- **Success (`200 OK`)**: Updated `ProductResponse`.
- **Errors**: `400`, `403`, `404`.

#### 20. `DELETE /api/vendor/products/{productId}`
- **Success (`204 No Content`)** (soft delete: sets `deleted = true`, `available = false`).
- **Errors**: `403`, `404`.

#### 21. `GET /api/orders/vendor/orders`
- **Success (`200 OK`)**: Array of incoming `OrderResponse` for logged-in vendor, newest first.

#### 22. `PUT /api/orders/{orderId}/status`
- **Request**:
```json
{
  "status": "PREPARING"
}
```
- **Valid transitions**: `PENDING → PREPARING | CANCELLED`, `PREPARING → READY | CANCELLED`, `READY → COMPLETED`. Transitioning to `CANCELLED` automatically restores stock for physical products.
- **Success (`200 OK`)**: Updated `OrderResponse`.
- **Errors**: `400` invalid status transition, `403` another vendor's order, `404` order not found.

---

### 4.5 Student Endpoints (`ROLE_STUDENT`)

#### 23. `GET /api/vendors` (Optional query param: `?category=CANTEEN`)
- **Success (`200 OK`)**: Array of approved & available `VendorSummaryResponse` belonging strictly to the student's college.

#### 24. `GET /api/products`
- **Success (`200 OK`)**: Array of available, non-deleted `ProductResponse` from approved & available vendors in the student's college.

#### 25. `GET /api/products/vendor/{vendorId}`
- **Success (`200 OK`)**: Array of available, non-deleted `ProductResponse` for that vendor.
- **Errors**: `400` vendor not approved/available, `403` cross-college vendor, `404` vendor not found.

#### 26. `POST /api/orders`
- **Request**:
```json
{
  "vendorId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```
- **Success (`201 Created`)**:
```json
{
  "orderId": 1,
  "tokenNumber": 1,
  "tokenDate": "2026-11-24",
  "vendorId": 1,
  "vendorName": "MVIT Central Canteen",
  "studentName": "Aarav Sharma",
  "totalAmount": 90.00,
  "status": "PENDING",
  "createdAt": "2026-11-24T17:00:00",
  "updatedAt": "2026-11-24T17:00:00",
  "items": [
    {
      "productName": "Masala Dosa",
      "unitPrice": 45.00,
      "quantity": 2,
      "subtotal": 90.00
    }
  ]
}
```
- **Errors**: `400` unavailable product / product belongs to different vendor / validation error, `403` cross-college vendor, `404` vendor or product missing/deleted, `409` insufficient stock.

#### 27. `GET /api/orders/my-orders`
- **Success (`200 OK`)**: Student's order history, newest first.

#### 28. `GET /api/orders/{orderId}`
- **Success (`200 OK`)**: Single `OrderResponse` for tracking token & status.
- **Errors**: `403` another student's order, `404` order not found.

#### 29. `PUT /api/orders/{orderId}/cancel`
- **Success (`200 OK`)**: Cancelled `OrderResponse` (allowed only when `PENDING`; restores stock automatically).
- **Errors**: `400` order is not `PENDING`, `403` another student's order, `404` order not found.

---

## 5. Comprehensive Postman Testing Guide (22 Scenarios)

Set Postman Environment variables: `baseUrl = http://localhost:8080`, `superAdminToken`, `adminToken`, `vendorToken`, `studentToken`, `vendorId`, `productId`, `orderId`.

1. **Super Admin Login**: `POST {{baseUrl}}/api/auth/login` with bootstrapped Super Admin email/password → Expect `200 OK`, save `token` to `superAdminToken`.
2. **College Creation**: `POST {{baseUrl}}/api/super-admin/colleges` (Bearer `superAdminToken`) with `collegeCode: "BMSIT"` → Expect `201 Created`. Retry same code → Expect `409 Conflict`.
3. **College Listing**: `GET {{baseUrl}}/api/super-admin/colleges` (Bearer `superAdminToken`) → Expect `200 OK` with all colleges. Also test `GET {{baseUrl}}/api/colleges` with **no auth** → Expect `200 OK` with only active colleges and registration fields.
4. **College Admin Creation**: `POST {{baseUrl}}/api/super-admin/admins` (Bearer `superAdminToken`) for `MVIT` → Expect `201 Created`. Retry same email → Expect `409 Conflict`. Send blank email → Expect `400 Bad Request` with `fieldErrors`.
5. **College Admin Login**: `POST {{baseUrl}}/api/auth/login` with MVIT admin credentials → Expect `200 OK`, save `adminToken`.
6. **Vendor Registration**: `POST {{baseUrl}}/api/vendors/register` (no auth) for `MVIT` with `categories: ["CANTEEN"]` → Expect `201 Created`, `approvalStatus: "PENDING"`, save `vendorId`.
7. **Vendor Approval**: `GET {{baseUrl}}/api/admin/vendors/pending` (Bearer `adminToken`) → verify vendor appears. Then `PUT {{baseUrl}}/api/admin/vendors/{{vendorId}}/approve` → Expect `200 OK`, `approvalStatus: "APPROVED"`, `available: true`. Confirm in `GET {{baseUrl}}/api/admin/vendors/approved`.
8. **Vendor Login**: `POST {{baseUrl}}/api/auth/login` with vendor credentials → Expect `200 OK`, save `vendorToken`. Test `GET {{baseUrl}}/api/vendor/profile`.
9. **Product Creation**: `POST {{baseUrl}}/api/vendor/products` (Bearer `vendorToken`) with `name: "Samosa"`, `price: 15.00`, `stockQuantity: 5` → Expect `201 Created`, save `productId`. Also create a Xerox service item with `stockQuantity: null` → Expect `201 Created`.
10. **Product Update**: `PUT {{baseUrl}}/api/vendor/products/{{productId}}` (Bearer `vendorToken`) updating price/stock → Expect `200 OK` with updated `updatedAt`.
11. **Student Registration**: `POST {{baseUrl}}/api/students/register` (no auth) with `collegeCode: "MVIT"` → Expect `201 Created`.
12. **Student Login**: `POST {{baseUrl}}/api/auth/login` with student credentials → Expect `200 OK`, save `studentToken`.
13. **Student Vendor & Product Browsing**: `GET {{baseUrl}}/api/vendors` and `GET {{baseUrl}}/api/products/vendor/{{vendorId}}` (Bearer `studentToken`) → Expect `200 OK` showing only MVIT's approved, available vendors/products.
14. **Order Placement**: `POST {{baseUrl}}/api/orders` (Bearer `studentToken`) with `vendorId` and `items: [{"productId": {{productId}}, "quantity": 2}]` → Expect `201 Created`, `status: "PENDING"`, stock reduced from `5` to `3`, save `orderId`.
15. **Token Generation**: Place a second order on the same day with the same vendor → Expect `tokenNumber: 2` (`tokenDate` = today). Check `GET {{baseUrl}}/api/orders/{{orderId}}` and `GET {{baseUrl}}/api/orders/my-orders`.
16. **Order Status Updates**: As Vendor (`vendorToken`), call `PUT {{baseUrl}}/api/orders/{{orderId}}/status` sequentially: `PREPARING` → `READY` → `COMPLETED` → Expect `200 OK` each time. Try `PENDING → COMPLETED` directly → Expect `400 Bad Request`.
17. **Student Cancellation**: Place a fresh order (`PENDING`), then call `PUT {{baseUrl}}/api/orders/<newOrderId>/cancel` (Bearer `studentToken`) → Expect `200 OK`, `status: "CANCELLED"`. Try cancelling a `PREPARING` order as student → Expect `400 Bad Request`.
18. **Stock Restoration**: After Test 17 (and also after a vendor cancels a `PREPARING` order via `PUT /api/orders/{id}/status` with `{"status": "CANCELLED"}`), call `GET {{baseUrl}}/api/vendor/products` → Confirm `stockQuantity` increased back by the cancelled quantity.
19. **Unauthorized Access Tests**:
    - Call `GET {{baseUrl}}/api/orders/my-orders` without token → Expect `401 Unauthorized` JSON.
    - Call `POST {{baseUrl}}/api/super-admin/colleges` with `studentToken` or `adminToken` → Expect `403 Forbidden` JSON.
    - Call `POST {{baseUrl}}/api/vendor/products` with `studentToken` → Expect `403 Forbidden` JSON.
20. **Cross-College Access Tests**:
    - Register a vendor and student under `BMSIT` (created in Test 2).
    - MVIT Admin calls `PUT {{baseUrl}}/api/admin/vendors/<bmsitVendorId>/approve` → Expect `403 Forbidden`.
    - MVIT Student calls `GET {{baseUrl}}/api/products/vendor/<bmsitVendorId>` → Expect `403 Forbidden`.
    - MVIT Student calls `POST {{baseUrl}}/api/orders` with `vendorId: <bmsitVendorId>` → Expect `403 Forbidden`.
21. **Insufficient-Stock & Duplicate-ID Tests**:
    - Set product stock to `3`. Send `POST {{baseUrl}}/api/orders` with `items: [{"productId": {{productId}}, "quantity": 2}, {"productId": {{productId}}, "quantity": 2}]` → Expect `409 Conflict` (combined quantity 4 > stock 3) and verify stock remains `3`.
22. **Concurrent-Order Test**:
    - Set product stock to `1`. Using Postman Collection Runner (2+ virtual users) or two parallel `curl` commands in bash (`curl ... & curl ... & wait`), submit two simultaneous `POST /api/orders` requests for quantity `1` → Exactly **one** succeeds (`201 Created`, stock becomes `0`) and the second fails (`409 Conflict`, `"Insufficient stock..."`). Stock never goes negative.

---

## 6. Build, Testing & Remaining Manual Verification Steps

- **Environment Limitation**: This review environment runs offline OpenJDK 17 without Maven or MySQL 8 installed, so `mvn clean test` could not be executed here. All 77 Java files were verified statically for package declarations, type names, internal imports, and syntax.
- **Run Locally on Java 21 + MySQL 8**:
  1. Copy `.env.example` to `.env` and fill in `DB_PASSWORD`, a 256-bit Base64 `JWT_SECRET` (`openssl rand -base64 32`), and Super Admin bootstrap credentials.
  2. Run unit tests (no MySQL required):
     ```bash
     ./mvnw test -Dtest=OrderServiceTest,CollegeServiceTest,VendorServiceTest,ProductServiceTest
     ```
  3. Run full build and Spring Boot context test (requires running MySQL 8 + env vars):
     ```bash
     ./mvnw clean test
     ```
  4. Verify MySQL concurrency (Test 22) and daily token reset across date rollover manually against MySQL 8.
