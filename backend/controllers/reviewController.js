const mongoose = require('mongoose');
const Review = require('../models/Review');
const Boarding = require('../models/Boarding');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { boarding, ratings, comment } = req.body;

    const boardingId =
      typeof boarding === 'object' && boarding !== null
        ? boarding.$oid || boarding._id || boarding.id || boarding
        : boarding;

    if (!boardingId || !mongoose.Types.ObjectId.isValid(boardingId)) {
      return res.status(400).json({ message: 'Invalid boarding id' });
    }

    const boardingExists = await Boarding.exists({ _id: boardingId });
    if (!boardingExists) {
      return res.status(400).json({ message: 'Boarding not found' });
    }

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ message: 'At least one rating is required' });
    }

    const cleanedRatings = ratings
      .filter(r => r && typeof r.tag === 'string' && r.tag.trim() !== '')
      .map(r => ({ tag: r.tag.trim(), score: Number(r.score) }))
      .filter(r => Number.isFinite(r.score) && r.score >= 1 && r.score <= 5);

    if (cleanedRatings.length === 0) {
      return res.status(400).json({ message: 'Ratings must include tag and score (1-5)' });
    }

    // Calculate overall rating: (sum of stars / 20) * 100
    const totalStars = cleanedRatings.reduce((acc, r) => acc + r.score, 0);
    const overallRating = Math.round(((totalStars / 20) * 100) * 10) / 10;

    const review = new Review({
      student: req.user._id,
      boarding: boardingId,
      ratings: cleanedRatings,
      overallRating,
      comment: typeof comment === 'string' ? comment : ''
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('createReview error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Get all reviews by the logged-in student
exports.getStudentReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ student: req.user._id })
      .populate('boarding', 'title address city');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all reviews for a boarding
exports.getBoardingReviews = async (req, res) => {
  try {
    const { boardingId } = req.params;
    const reviews = await Review.find({ boarding: boardingId })
      .populate('student', 'name email');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { ratings, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, student: req.user._id },
      { ratings, comment, updatedAt: Date.now() },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findOneAndDelete({ _id: reviewId, student: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
