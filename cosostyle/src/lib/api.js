import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cosostyle-com.onrender.com';

async function apiRequest(endpoint, options = {}) {
  // Use Firebase ID token if user is logged in, else fall back to legacy localStorage token
  let token = null;
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      token = await currentUser.getIdToken();
    } catch {
      token = localStorage.getItem('coso_token');
    }
  } else {
    token = localStorage.getItem('coso_token');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json().catch(() => ({}));
}


export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name, email, password) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  getProfile: () => apiRequest('/auth/me'),

  updateProfile: (profileData) =>
    apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  changePassword: (oldPassword, newPassword) =>
    apiRequest('/auth/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email, code, newPassword) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),

  loginGoogle: (email, name, googleId) =>
    apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ email, name, googleId }) }),

  sendOtp: (email) =>
    apiRequest('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyOtp: (email, code) =>
    apiRequest('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),

  // ── Addresses ─────────────────────────────────────────────────────────────
  saveAddress: (address) =>
    apiRequest('/auth/addresses', { method: 'POST', body: JSON.stringify(address) }),

  deleteAddress: (id) =>
    apiRequest(`/auth/addresses/${id}`, { method: 'DELETE' }),

  // ── Wishlist (backend-persisted) ──────────────────────────────────────────
  getWishlist: () => apiRequest('/wishlist'),

  toggleWishlistBackend: (productId) =>
    apiRequest('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) }),

  // ── Loyalty Points ────────────────────────────────────────────────────────
  getLoyalty: () => apiRequest('/loyalty'),

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts: () => apiRequest('/products'),
  getProduct: (id) => apiRequest(`/products/${id}`),

  getReviews: (productId) => apiRequest(`/products/${productId}/reviews`),

  addReview: (productId, reviewData) =>
    apiRequest(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),

  likeReview: (productId, reviewId) =>
    apiRequest(`/products/${productId}/reviews/${reviewId}/like`, { method: 'PUT' }),

  notifyBackInStock: (productId, email) =>
    apiRequest(`/products/${productId}/notify-back-in-stock`, { method: 'POST', body: JSON.stringify({ email }) }),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: () => apiRequest('/orders'),
  getOrder: (id) => apiRequest(`/orders/${id}`),

  createOrder: (orderData) =>
    apiRequest('/orders', { method: 'POST', body: JSON.stringify(orderData) }),

  cancelOrder: (orderId) =>
    apiRequest(`/orders/${orderId}/cancel`, { method: 'PUT' }),

  submitReturnRequest: (orderId, returnData) =>
    apiRequest(`/orders/${orderId}/return`, { method: 'POST', body: JSON.stringify(returnData) }),

  submitExchangeRequest: (orderId, exchangeData) =>
    apiRequest(`/orders/${orderId}/exchange`, { method: 'POST', body: JSON.stringify(exchangeData) }),

  // ── Returns ───────────────────────────────────────────────────────────────
  getReturns: () => apiRequest('/returns'),

  // ── Coupon ────────────────────────────────────────────────────────────────
  validateCoupon: (code) =>
    apiRequest('/coupons/validate', { method: 'POST', body: JSON.stringify({ code }) }),

  // ── Newsletter ────────────────────────────────────────────────────────────
  subscribeNewsletter: (email) =>
    apiRequest('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),

  unsubscribeNewsletter: (email) =>
    apiRequest('/newsletter/unsubscribe', { method: 'POST', body: JSON.stringify({ email }) }),

  // ── Support Tickets ───────────────────────────────────────────────────────
  submitTicket: (ticketData) =>
    apiRequest('/support/tickets', { method: 'POST', body: JSON.stringify(ticketData) }),

  getMyTickets: () => apiRequest('/support/tickets'),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: () => apiRequest('/notifications'),

  markNotificationAsRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PUT' }),

  // ── Blogs ─────────────────────────────────────────────────────────────────
  getBlogs: () => apiRequest('/blogs'),
  getBlog: (id) => apiRequest(`/blogs/${id}`),

  // ── Banners ───────────────────────────────────────────────────────────────
  getBanners: () => apiRequest('/banners'),

  // ── Admin: Analytics ──────────────────────────────────────────────────────
  getAnalytics: () => apiRequest('/admin/analytics'),

  // ── Admin: Orders ─────────────────────────────────────────────────────────
  getAdminOrders: () => apiRequest('/admin/orders'),

  updateOrderStatus: (orderId, status) =>
    apiRequest(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // ── Admin: Products ───────────────────────────────────────────────────────
  createProduct: (productData) =>
    apiRequest('/admin/products', { method: 'POST', body: JSON.stringify(productData) }),

  updateProduct: (productMongoId, productData) =>
    apiRequest(`/admin/products/${productMongoId}`, { method: 'PUT', body: JSON.stringify(productData) }),

  updateProductStock: (productMongoId, inventory) =>
    apiRequest(`/admin/products/${productMongoId}/stock`, { method: 'PUT', body: JSON.stringify({ inventory }) }),

  deleteProduct: (productMongoId) =>
    apiRequest(`/admin/products/${productMongoId}`, { method: 'DELETE' }),

  // ── Admin: Inventory ──────────────────────────────────────────────────────
  getInventory: () => apiRequest('/admin/inventory'),

  // ── Admin: Coupons ────────────────────────────────────────────────────────
  getAdminCoupons: () => apiRequest('/admin/coupons'),

  createCoupon: (code, discountPercent) =>
    apiRequest('/admin/coupons', { method: 'POST', body: JSON.stringify({ code, discountPercent }) }),

  toggleCoupon: (couponMongoId) =>
    apiRequest(`/admin/coupons/${couponMongoId}/toggle`, { method: 'PUT' }),

  deleteCoupon: (couponMongoId) =>
    apiRequest(`/admin/coupons/${couponMongoId}`, { method: 'DELETE' }),

  // ── Admin: Returns ────────────────────────────────────────────────────────
  getAdminReturns: () => apiRequest('/admin/returns'),

  updateReturnStatus: (returnId, status) =>
    apiRequest(`/admin/returns/${returnId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // ── Admin: Blogs ──────────────────────────────────────────────────────────
  createBlog: (blogData) =>
    apiRequest('/admin/blogs', { method: 'POST', body: JSON.stringify(blogData) }),

  updateBlog: (id, blogData) =>
    apiRequest(`/admin/blogs/${id}`, { method: 'PUT', body: JSON.stringify(blogData) }),

  deleteBlog: (id) =>
    apiRequest(`/admin/blogs/${id}`, { method: 'DELETE' }),

  // ── Admin: Banners ────────────────────────────────────────────────────────
  getAdminBanners: () => apiRequest('/admin/banners'),

  createBanner: (bannerData) =>
    apiRequest('/admin/banners', { method: 'POST', body: JSON.stringify(bannerData) }),

  updateBanner: (id, bannerData) =>
    apiRequest(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(bannerData) }),

  deleteBanner: (id) =>
    apiRequest(`/admin/banners/${id}`, { method: 'DELETE' }),

  // ── Admin: Users ──────────────────────────────────────────────────────────
  getAdminUsers: () => apiRequest('/admin/users'),

  updateUserRole: (userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // ── Admin: Reviews ────────────────────────────────────────────────────────
  getAdminReviews: () => apiRequest('/admin/reviews'),

  deleteReview: (reviewId) =>
    apiRequest(`/admin/reviews/${reviewId}`, { method: 'DELETE' }),

  // ── Admin: Newsletter ─────────────────────────────────────────────────────
  getNewsletterSubscribers: () => apiRequest('/admin/newsletter'),

  // ── Admin: Support Tickets ────────────────────────────────────────────────
  getAdminTickets: () => apiRequest('/admin/support/tickets'),

  updateTicket: (ticketId, updates) =>
    apiRequest(`/admin/support/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify(updates) })
};
