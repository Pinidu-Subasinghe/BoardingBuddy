const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getOwnerAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/owner', protect, authorize('owner'), getOwnerAnalytics);

module.exports = router;