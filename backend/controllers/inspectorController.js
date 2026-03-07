const Boarding = require('../models/Boarding');
const InspectorRating = require('../models/InspectorRating');
const { addNotification } = require('../utils/notification');

// Inspector: Rate or reject a boarding
const rateBoarding = async (req, res) => {
  try {
    const { boardingId, lifestyleRatings, safetyBadge, remark, reject } = req.body;

    const boarding = await Boarding.findById(boardingId);
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    // Check if inspector assigned
    if (!boarding.assignedInspector || boarding.assignedInspector.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (reject) {
      boarding.status = 'rejected';
      await boarding.save();
      try {
        addNotification({
          userId: boarding.owner,
          message: `Your boarding was rejected by the inspector: ${boarding.title}`,
          type: 'boarding_rejected',
          data: { boardingId: boarding._id.toString() }
        });
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr);
      }
      return res.json({ message: 'Boarding rejected', boarding });
    }

    // Calculate overall percentage
    const totalStars = lifestyleRatings.length * 5 || 1;
    const receivedStars = lifestyleRatings.reduce((acc, tag) => acc + (tag.stars || 0), 0);
    const overallPercentage = (receivedStars / totalStars) * 100;

    // Create rating
    const rating = await InspectorRating.create({
      boarding: boarding._id,
      inspector: req.user._id,
      lifestyleRatings,
      safetyBadge,
      overallPercentage,
      remark
    });

    // Update boarding status based on rating
    boarding.status = 'approved';
    if (overallPercentage > 50 && (safetyBadge === 'medium' || safetyBadge === 'high')) {
      boarding.status = 'approved';
    }

    await boarding.save();

    try {
      addNotification({
        userId: boarding.owner,
        message: `Your boarding was approved by the inspector: ${boarding.title}`,
        type: 'boarding_approved',
        data: { boardingId: boarding._id.toString() }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({ message: 'Boarding rated successfully', rating, boarding });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: Get inspector ratings (optionally filter by boardingId)
const getRatings = async (req, res) => {
  try {
    const { boardingId } = req.query;
    const query = {};
    if (boardingId) query.boarding = boardingId;
    const ratings = await InspectorRating.find(query).populate('boarding', 'title').populate('inspector', 'name');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { rateBoarding, getRatings };