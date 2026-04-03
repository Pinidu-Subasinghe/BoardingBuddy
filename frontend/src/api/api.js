import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Notification APIs
export const getNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.post('/notifications/read');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// Review APIs
export const createReview = (data) => API.post('/reviews', data);
export const getStudentReviews = () => API.get('/reviews/mine');
export const updateReview = (reviewId, data) => API.put(`/reviews/${reviewId}`, data);
export const deleteReview = (reviewId) => API.delete(`/reviews/${reviewId}`);
// Get reviews for a specific boarding
export const getReviewsForBoarding = (boardingId) => API.get(`/reviews/boarding/${boardingId}`);

// Attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// HANDLE ERRORS PROPERLY HERE
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong';

    // IMPORTANT: reject with clean error
    return Promise.reject({
      message,
      response: error.response
    });
  }
);


// Auth APIs
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const verifyRegistrationOtp = (data) => API.post('/auth/verify-otp', data);
export const forgotPasswordRequest = (data) => API.post('/auth/forgot-password', data);
export const verifyForgotPasswordOtpRequest = (data) => API.post('/auth/forgot-password/verify-otp', data);
export const resetPasswordWithOtpRequest = (data) => API.post('/auth/forgot-password/reset', data);

// User profile
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);
export const deleteProfile = () => API.delete('/users/profile');

// Boarding APIs
export const addBoarding = (data) => API.post('/boardings', data);
export const getBoardings = () => API.get('/boardings');
export const getBoarding = (id) => API.get(`/boardings/${id}`);
export const updateBoarding = (id, data) => API.put(`/boardings/${id}`, data);
export const deleteBoarding = (id) => API.delete(`/boardings/${id}`);

// Admin APIs
export const assignInspector = (data) => API.put('/admin/assign-inspector', data);
export const getAdminReviews = () => API.get('/admin/reviews');
export const deleteAdminReview = (reviewId) => API.delete(`/admin/reviews/${reviewId}`);
export const getAllUsers = () => API.get('/users');
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Inspector APIs
export const rateBoarding = (data) => API.post('/inspector/rate', data);
export const getInspectorRatings = (params) => API.get('/inspector/ratings', { params });

// Booking APIs
export const createBooking = (data) => API.post('/bookings', data);
export const cancelBooking = (id) => API.put(`/bookings/${id}/cancel`);
export const getMyBookings = () => API.get('/bookings/my');
export const getOwnerBookings = () => API.get('/bookings/owner');
export const markVisitComplete = (id) => API.put(`/bookings/${id}/visit-complete`);
export const confirmStay = (id, data) => API.put(`/bookings/${id}/confirm-stay`, data);
export const closeBooking = (id) => API.put(`/bookings/${id}/close`);

// Ongoing stay actions
export const extendStay = (id, newEndDate) => API.put(`/bookings/${id}/extend`, { newEndDate });
export const endStay = (id) => API.put(`/bookings/${id}/end`);

// Payment APIs
export const createCardPayment = (data) => API.post('/payments/card', data);
export const getMyPayments = () => API.get('/payments/my');
export const getOwnerPayments = () => API.get('/payments/owner');
export const getPaymentById = (id) => API.get(`/payments/${id}`);

// Wishlist APIs
export const addToWishlist = (boardingId) => API.post('/wishlist', { boardingId });
export const getMyWishlist = () => API.get('/wishlist/my');
export const removeFromWishlist = (boardingId) => API.delete(`/wishlist/${boardingId}`);

// Analytics APIs
export const getOwnerAnalytics = () => API.get('/analytics/owner');

// Inquiry APIs
export const createInquiry = (data) => API.post('/inquiries', data);
export const getMyInquiries = () => API.get('/inquiries/my');
export const getAllInquiries = () => API.get('/inquiries');
export const updateInquiryStatus = (id, status) => API.put(`/inquiries/${id}/status`, { status });
export const addInquiryResponse = (id, response) => API.put(`/inquiries/${id}/response`, { response });
export const applyInquiryPenalty = (id, payload) => API.post(`/inquiries/${id}/penalty`, payload);
export const deleteInquiry = (id) => API.delete(`/inquiries/${id}`);