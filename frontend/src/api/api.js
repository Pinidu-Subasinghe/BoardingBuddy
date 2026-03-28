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

// Analytics APIs
export const getOwnerAnalytics = () => API.get('/analytics/owner');

// Chatbot API
export const askBrowseChatbot = (data) => API.post('/chatbot/ask', data);