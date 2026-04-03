const Boarding = require('../models/Boarding');
const Review = require('../models/Review');
const { addNotification } = require('../utils/notification');

// Admin: Assign inspector to a boarding
const assignInspector = async (req, res) => {
  try {
    const { boardingId, inspectorId } = req.body;
    const boarding = await Boarding.findById(boardingId);
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    boarding.assignedInspector = inspectorId;
    await boarding.save();

    try {
      addNotification({
        userId: boarding.owner,
        message: `An inspector has been assigned to your boarding: ${boarding.title}`,
        type: 'inspector_assigned',
        data: { boardingId: boarding._id.toString(), inspectorId }
      });
      addNotification({
        userId: inspectorId,
        message: `You have been assigned to inspect: ${boarding.title}`,
        type: 'inspector_assigned',
        data: { boardingId: boarding._id.toString() }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({ message: 'Inspector assigned', boarding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all student reviews for moderation (newest updates first)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('student', 'name')
      .populate('boarding', 'title')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete any review by id
const deleteReviewByAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { assignInspector, getAllReviews, deleteReviewByAdmin };