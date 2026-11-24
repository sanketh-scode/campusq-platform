# CampusQ Frontend (React + Vite)

Modern React frontend for the CampusQ multi-college, multi-vendor pre-order and token management backend.

## Features by Role
- **Public**: Login, Student Registration, Vendor Registration (auto-loads active colleges from `GET /api/colleges`).
- **Super Admin (`/super-admin`)**: View all colleges, create new colleges, create College Admins.
- **College Admin (`/admin`)**: Review pending vendor requests, approve/reject vendors, view approved/all vendors in their college.
- **Vendor (`/vendor`)**: Manage incoming orders with one-click valid status transitions (`PENDING → PREPARING → READY → COMPLETED` or `CANCELLED`), manage products (physical stock or nullable Xerox/service stock, availability toggle, soft delete), and edit shop profile.
- **Student (`/student`)**: Browse approved & available campus vendors by category, view menus with live stock, build a single-vendor cart, place orders to receive a daily token number, track order status, and cancel `PENDING` orders.

## Quick Start
1. Make sure `campusq-backend` is running on `http://localhost:8080` (with `CORS_ALLOWED_ORIGINS=http://localhost:5173`).
2. Install dependencies and start Vite:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
