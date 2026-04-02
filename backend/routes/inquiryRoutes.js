const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  updateInquiryStatus,
  addAdminResponse,
  applyPenaltyPoints,
  deleteInquiry,
} = require('../controllers/inquiryController');

// User routes
router.post('/', protect, authorize('student', 'owner', 'inspector'), createInquiry);
router.get('/my', protect, authorize('student', 'owner', 'inspector'), getMyInquiries);

// Admin routes
router.get('/', protect, authorize('admin'), getAllInquiries);
router.put('/:id/status', protect, authorize('admin'), updateInquiryStatus);
router.put('/:id/response', protect, authorize('admin'), addAdminResponse);
router.post('/:id/penalty', protect, authorize('admin'), applyPenaltyPoints);
router.delete('/:id', protect, authorize('student', 'owner', 'inspector', 'admin'), deleteInquiry);

module.exports = router;
