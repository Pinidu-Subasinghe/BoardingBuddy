const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createBooking, getMyBookings, getOwnerBookings, markVisitCompleted, confirmStay, closeBooking } = require('../controllers/bookingController');

// Student creates a booking/visit request
router.post('/', protect, authorize('student'), createBooking);

// Student: get my bookings
router.get('/my', protect, authorize('student'), getMyBookings);

// Owner: get bookings for owner
router.get('/owner', protect, authorize('owner'), getOwnerBookings);

// Owner actions
router.put('/:id/visit-complete', protect, authorize('owner'), markVisitCompleted);
router.put('/:id/confirm-stay', protect, authorize('owner'), confirmStay);

// Ongoing stay actions
router.put('/:id/extend', protect, authorize('owner'), require('../controllers/bookingController').extendStay);
router.put('/:id/end', protect, authorize('owner'), require('../controllers/bookingController').endStay);
router.put('/:id/close', protect, authorize('owner'), closeBooking);

module.exports = router;
