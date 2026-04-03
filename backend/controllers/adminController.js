const Boarding = require('../models/Boarding');
const Review = require('../models/Review');
const User = require('../models/User');
const Inquiry = require('../models/Inquiry');
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

const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalOwners,
      totalBoardings,
      totalInquiries,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'owner' }),
      Boarding.countDocuments({}),
      Inquiry.countDocuments({}),
      Review.countDocuments({}),
    ]);

    return res.json({
      totalUsers,
      totalStudents,
      totalOwners,
      totalBoardings,
      totalInquiries,
      totalReviews,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdminAnalyticsDetails = async (req, res) => {
  try {
    const [
      totalStudents,
      totalOwners,
      totalBoardings,
      approvedBoardings,
      pendingBoardings,
      rejectedBoardings,
      inquiryStatusRows,
      penaltiesAgg,
      topPenalizedBoardings,
      recentUsers,
      recentInquiries,
      recentBoardings,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'owner' }),
      Boarding.countDocuments({}),
      Boarding.countDocuments({ status: 'approved' }),
      Boarding.countDocuments({ status: { $in: ['pending', 'inspector assigned'] } }),
      Boarding.countDocuments({ status: 'rejected' }),
      Inquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Boarding.aggregate([
        {
          $group: {
            _id: null,
            totalPenaltyPoints: { $sum: { $ifNull: ['$penaltyPoints', 0] } },
            penalizedBoardingsCount: {
              $sum: {
                $cond: [{ $gt: [{ $ifNull: ['$penaltyPoints', 0] }, 0] }, 1, 0],
              },
            },
          },
        },
      ]),
      Boarding.find({ penaltyPoints: { $gt: 0 } })
        .sort({ penaltyPoints: -1, updatedAt: -1 })
        .limit(5)
        .select('title city status penaltyPoints updatedAt')
        .lean(),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name role createdAt')
        .lean(),
      Inquiry.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt')
        .lean(),
      Boarding.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title city status createdAt')
        .lean(),
    ]);

    const inquiryAnalytics = {
      pending: 0,
      inReview: 0,
      resolved: 0,
      rejected: 0,
    };

    inquiryStatusRows.forEach((row) => {
      if (row._id === 'Pending') inquiryAnalytics.pending = row.count;
      if (row._id === 'In Review') inquiryAnalytics.inReview = row.count;
      if (row._id === 'Resolved') inquiryAnalytics.resolved = row.count;
      if (row._id === 'Rejected') inquiryAnalytics.rejected = row.count;
    });

    const penalties = penaltiesAgg[0] || { totalPenaltyPoints: 0, penalizedBoardingsCount: 0 };

    return res.json({
      userDistribution: {
        students: totalStudents,
        owners: totalOwners,
      },
      boardingStats: {
        total: totalBoardings,
        active: approvedBoardings,
        inactive: Math.max(pendingBoardings + rejectedBoardings, 0),
      },
      inquiryAnalytics,
      penaltyInsights: {
        totalPenaltyPoints: penalties.totalPenaltyPoints || 0,
        penalizedBoardingsCount: penalties.penalizedBoardingsCount || 0,
        topPenalizedBoardings,
      },
      recentActivities: {
        newUsers: recentUsers,
        newInquiries: recentInquiries,
        newBoardings: recentBoardings,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  assignInspector,
  getAllReviews,
  deleteReviewByAdmin,
  getAdminAnalyticsSummary,
  getAdminAnalyticsDetails,
};