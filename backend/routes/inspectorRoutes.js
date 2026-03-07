const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { rateBoarding, getRatings } = require('../controllers/inspectorController');

// Rate boarding
router.post('/rate', protect, authorize('inspector'), rateBoarding);

// List ratings (public)
router.get('/ratings', getRatings);

module.exports = router;