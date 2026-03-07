const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { assignInspector } = require('../controllers/adminController');

// Assign inspector to boarding
router.put('/assign-inspector', protect, authorize('admin'), assignInspector);

module.exports = router;