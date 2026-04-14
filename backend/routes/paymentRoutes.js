const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadPaymentSlip } = require('../config/multer');
const {
  createCardPayment,
  createBankTransferPayment,
  getMyPayments,
  getOwnerPayments,
  getPaymentById
} = require('../controllers/paymentController');

const uploadBankTransferSlip = (req, res, next) => {
  uploadPaymentSlip.single('slipImage')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Only one slip image is allowed' });
    }

    return res.status(err.statusCode || 400).json({ message: err.message || 'Invalid slip upload' });
  });
};

// Student card payment
router.post('/card', protect, authorize('student'), createCardPayment);
router.post('/bank-transfer', protect, authorize('student'), uploadBankTransferSlip, createBankTransferPayment);

// Student/owner payment history
router.get('/my', protect, authorize('student'), getMyPayments);
router.get('/owner', protect, authorize('owner'), getOwnerPayments);

// Student/owner/admin payment detail
router.get('/:id', protect, getPaymentById);

module.exports = router;