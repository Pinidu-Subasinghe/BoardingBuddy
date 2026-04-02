const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCardPayment,
  getMyPayments,
  getOwnerPayments,
  getPaymentById
} = require('../controllers/paymentController');

// Student card payment
router.post('/card', protect, authorize('student'), createCardPayment);

// Student/owner payment history
router.get('/my', protect, authorize('student'), getMyPayments);
router.get('/owner', protect, authorize('owner'), getOwnerPayments);

// Student/owner/admin payment detail
router.get('/:id', protect, getPaymentById);

module.exports = router;