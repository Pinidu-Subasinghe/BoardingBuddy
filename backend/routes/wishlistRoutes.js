const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');

// Student wishlist: create, read, delete
router.post('/', protect, authorize('student'), addToWishlist);
router.get('/my', protect, authorize('student'), getMyWishlist);
router.delete('/:boardingId', protect, authorize('student'), removeFromWishlist);

module.exports = router;
