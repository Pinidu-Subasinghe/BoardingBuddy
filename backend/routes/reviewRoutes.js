const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');


// Create a review
router.post('/', protect, reviewController.createReview);

// Get all reviews for a boarding
router.get('/boarding/:boardingId', reviewController.getBoardingReviews);

// Get all reviews by the logged-in student
router.get('/mine', protect, reviewController.getStudentReviews);

// Update a review
router.put('/:reviewId', protect, reviewController.updateReview);

// Delete a review
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;
