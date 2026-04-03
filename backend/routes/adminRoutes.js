const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
	assignInspector,
	getAllReviews,
	deleteReviewByAdmin
} = require('../controllers/adminController');
const {
	getAdminAnalyticsSummary,
	getAdminAnalyticsDetails,
	getAdminAnalyticsReportData,
} = require('../controllers/adminAnalyticsController');

// Assign inspector to boarding
router.put('/assign-inspector', protect, authorize('admin'), assignInspector);

// Admin review moderation
router.get('/reviews', protect, authorize('admin'), getAllReviews);
router.delete('/reviews/:reviewId', protect, authorize('admin'), deleteReviewByAdmin);

// Admin analytics and reporting
router.get('/analytics/summary', protect, authorize('admin'), getAdminAnalyticsSummary);
router.get('/analytics/details', protect, authorize('admin'), getAdminAnalyticsDetails);
router.get('/analytics/report-data', protect, authorize('admin'), getAdminAnalyticsReportData);

module.exports = router;