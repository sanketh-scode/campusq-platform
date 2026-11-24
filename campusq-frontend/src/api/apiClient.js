const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, fieldErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = localStorage.getItem('campusq_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Unable to connect to CampusQ backend. Ensure Spring Boot is running on ' + API_BASE_URL,
      0
    );
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      localStorage.removeItem('campusq_token');
      localStorage.removeItem('campusq_user');
    }
    const message =
      data?.message ||
      (data?.fieldErrors ? Object.values(data.fieldErrors).join(', ') : null) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data?.fieldErrors || null);
  }

  return data;
}

export const campusqApi = {
  // Public
  getPublicColleges: () => apiRequest('/api/colleges', { auth: false }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  registerStudent: (payload) =>
    apiRequest('/api/students/register', { method: 'POST', body: payload, auth: false }),
  registerVendor: (payload) =>
    apiRequest('/api/vendors/register', { method: 'POST', body: payload, auth: false }),

  // Super Admin
  getAllColleges: () => apiRequest('/api/super-admin/colleges'),
  createCollege: (payload) =>
    apiRequest('/api/super-admin/colleges', { method: 'POST', body: payload }),
  createCollegeAdmin: (payload) =>
    apiRequest('/api/super-admin/admins', { method: 'POST', body: payload }),

  // College Admin
  getAdminAllVendors: () => apiRequest('/api/admin/vendors'),
  getAdminPendingVendors: () => apiRequest('/api/admin/vendors/pending'),
  getAdminApprovedVendors: () => apiRequest('/api/admin/vendors/approved'),
  getAdminVendorDetail: (vendorId) => apiRequest(`/api/admin/vendors/${vendorId}`),
  approveVendor: (vendorId) =>
    apiRequest(`/api/admin/vendors/${vendorId}/approve`, { method: 'PUT' }),
  rejectVendor: (vendorId) =>
    apiRequest(`/api/admin/vendors/${vendorId}/reject`, { method: 'PUT' }),

  // Vendor
  getVendorProfile: () => apiRequest('/api/vendor/profile'),
  updateVendorProfile: (payload) =>
    apiRequest('/api/vendor/profile', { method: 'PUT', body: payload }),
  getVendorProducts: () => apiRequest('/api/vendor/products'),
  addProduct: (payload) => apiRequest('/api/vendor/products', { method: 'POST', body: payload }),
  updateProduct: (productId, payload) =>
    apiRequest(`/api/vendor/products/${productId}`, { method: 'PUT', body: payload }),
  toggleProductAvailability: (productId, available) =>
    apiRequest(`/api/vendor/products/${productId}/availability?available=${available}`, {
      method: 'PATCH',
    }),
  deleteProduct: (productId) =>
    apiRequest(`/api/vendor/products/${productId}`, { method: 'DELETE' }),
  getVendorOrders: () => apiRequest('/api/orders/vendor/orders'),
  updateOrderStatus: (orderId, status) =>
    apiRequest(`/api/orders/${orderId}/status`, { method: 'PUT', body: { status } }),

  // Student
  browseVendors: (category) =>
    apiRequest(category ? `/api/vendors?category=${encodeURIComponent(category)}` : '/api/vendors'),
  getAllCollegeProducts: () => apiRequest('/api/products'),
  getVendorProductsForStudent: (vendorId) => apiRequest(`/api/products/vendor/${vendorId}`),
  placeOrder: (payload) => apiRequest('/api/orders', { method: 'POST', body: payload }),
  getMyOrders: () => apiRequest('/api/orders/my-orders'),
  getMyOrderById: (orderId) => apiRequest(`/api/orders/${orderId}`),
  cancelOrder: (orderId) => apiRequest(`/api/orders/${orderId}/cancel`, { method: 'PUT' }),
};
