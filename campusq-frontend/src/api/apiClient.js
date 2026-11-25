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
    const token = sessionStorage.getItem('campusq_token');
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
      sessionStorage.removeItem('campusq_token');
      sessionStorage.removeItem('campusq_user');
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
  // Public & Auth
  getPublicColleges: () => apiRequest('/api/colleges', { auth: false }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  googleLogin: (idToken) =>
    apiRequest('/api/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  completeGoogleRegistration: (payload) =>
    apiRequest('/api/auth/google/complete', { method: 'POST', body: payload, auth: false }),
  registerStudentOrStaff: (payload) =>
    apiRequest('/api/students/register', { method: 'POST', body: payload, auth: false }),
  registerVendor: (payload) =>
    apiRequest('/api/vendors/register', { method: 'POST', body: payload, auth: false }),

  // Notifications
  getNotifications: () => apiRequest('/api/notifications'),
  getUnreadNotificationCount: () => apiRequest('/api/notifications/unread-count'),
  markNotificationRead: (id) =>
    apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest('/api/notifications/read-all', { method: 'PATCH' }),

  // Super Admin
  getAllColleges: () => apiRequest('/api/super-admin/colleges'),
  createCollege: (payload) =>
    apiRequest('/api/super-admin/colleges', { method: 'POST', body: payload }),
  updateCollege: (collegeId, payload) =>
    apiRequest(`/api/super-admin/colleges/${collegeId}`, { method: 'PUT', body: payload }),
  getAllCollegeAdmins: () => apiRequest('/api/super-admin/admins'),
  createCollegeAdmin: (payload) =>
    apiRequest('/api/super-admin/admins', { method: 'POST', body: payload }),
  updateCollegeAdmin: (adminId, payload) =>
    apiRequest(`/api/super-admin/admins/${adminId}`, { method: 'PUT', body: payload }),
  deactivateCollegeAdmin: (adminId) =>
    apiRequest(`/api/super-admin/admins/${adminId}`, { method: 'DELETE' }),

  // College Admin
  getAdminAllVendors: () => apiRequest('/api/admin/vendors'),
  getAdminPendingVendors: () => apiRequest('/api/admin/vendors/pending'),
  getAdminApprovedVendors: () => apiRequest('/api/admin/vendors/approved'),
  approveVendor: (vendorId) =>
    apiRequest(`/api/admin/vendors/${vendorId}/approve`, { method: 'PUT' }),
  rejectVendor: (vendorId) =>
    apiRequest(`/api/admin/vendors/${vendorId}/reject`, { method: 'PUT' }),
  deactivateVendor: (vendorId) =>
    apiRequest(`/api/admin/vendors/${vendorId}`, { method: 'DELETE' }),
  getAdminComplaints: () => apiRequest('/api/admin/complaints'),
  updateComplaint: (complaintId, payload) =>
    apiRequest(`/api/admin/complaints/${complaintId}`, { method: 'PUT', body: payload }),

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
  verifyStaffMember: (studentId, isStaff) =>
    apiRequest(`/api/orders/vendor/verify-staff/${studentId}`, {
      method: 'PUT',
      body: { isStaff },
    }),

  // Student & Staff
  browseVendors: (category, search) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return apiRequest(qs ? `/api/vendors?${qs}` : '/api/vendors');
  },
  getAllCollegeProducts: (search) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest(`/api/products${qs}`);
  },
  getVendorProductsForStudent: (vendorId) => apiRequest(`/api/products/vendor/${vendorId}`),
  placeOrder: (payload) => apiRequest('/api/orders', { method: 'POST', body: payload }),
  submitOrderPayment: (orderId, payload) =>
    apiRequest(`/api/orders/${orderId}/pay`, { method: 'PUT', body: payload }),
  completeOrderByStudent: (orderId) =>
    apiRequest(`/api/orders/${orderId}/complete`, { method: 'PUT' }),
  getMyOrders: () => apiRequest('/api/orders/my-orders'),
  cancelOrder: (orderId) => apiRequest(`/api/orders/${orderId}/cancel`, { method: 'PUT' }),
  submitComplaint: (payload) => apiRequest('/api/complaints', { method: 'POST', body: payload }),
  getMyComplaints: () => apiRequest('/api/complaints/my'),
};
