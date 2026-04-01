const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
	assignInspector,
	getAllReviews,
	deleteReviewByAdmin
} = require('../controllers/adminController');

// Assign inspector to boarding
router.put('/assign-inspector', protect, authorize('admin'), assignInspector);

// Admin review moderation
router.get('/reviews', protect, authorize('admin'), getAllReviews);
router.delete('/reviews/:reviewId', protect, authorize('admin'), deleteReviewByAdmin);

module.exports = router;