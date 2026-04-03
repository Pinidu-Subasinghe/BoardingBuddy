const User = require('../models/User');
const Boarding = require('../models/Boarding');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');

const VALID_ROLE_FILTERS = ['student', 'owner'];

const parseDateFilters = (query) => {
  const { range = '30d', startDate, endDate } = query;
  const now = new Date();

  let from;
  let to = now;

  if (range === '7d') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    from = new Date(now);
    from.setDate(now.getDate() - 30);
  } else if (range === 'custom' && startDate && endDate) {
    from = new Date(startDate);
    to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date(now);
    from.setDate(now.getDate() - 30);
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const error = new Error('Invalid date range');
    error.status = 400;
    throw error;
  }

  return {
    createdAt: {
      $gte: from,
      $lte: to,
    },
    from,
    to,
    range,
  };
};

const parseRoleFilter = (query) => {
  const role = (query.role || '').toLowerCase();
  if (!role) {
    return null;
  }

  if (!VALID_ROLE_FILTERS.includes(role)) {
    const error = new Error('Invalid role filter');
    error.status = 400;
    throw error;
  }

  return role;
};

const buildFilters = (query) => {
  const dateFilter = parseDateFilters(query);
  const roleFilter = parseRoleFilter(query);
  return { dateFilter, roleFilter };
};

const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const { dateFilter, roleFilter } = buildFilters(req.query);
    const userMatch = { createdAt: dateFilter.createdAt };

    if (roleFilter) {
      userMatch.role = roleFilter;
    }

    const userCounts = await User.aggregate([
      { $match: userMatch },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byRole: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
        },
      },
    ]);

    const roleCountsMap = new Map();
    (userCounts[0]?.byRole || []).forEach((entry) => {
      roleCountsMap.set(entry._id, entry.count);
    });

    const includeBoardings = roleFilter !== 'student';
    const boardingMatch = includeBoardings ? { createdAt: dateFilter.createdAt } : { _id: null };
    const inquiryMatch = { createdAt: dateFilter.createdAt };
    if (roleFilter) {
      inquiryMatch.role = roleFilter;
    }

    const [totalBoardings, totalInquiries, totalReviews, totalPenalties] = await Promise.all([
      Boarding.countDocuments(boardingMatch),
      Inquiry.countDocuments(inquiryMatch),
      Review.countDocuments({ createdAt: dateFilter.createdAt }),
      Boarding.countDocuments({ ...boardingMatch, penaltyPoints: { $gt: 0 } }),
    ]);

    return res.json({
      totalUsers: userCounts[0]?.total?.[0]?.count || 0,
      totalStudents: roleCountsMap.get('student') || 0,
      totalOwners: roleCountsMap.get('owner') || 0,
      totalBoardings,
      totalInquiries,
      totalReviews,
      totalPenalties,
      filters: {
        role: roleFilter || 'all',
        range: dateFilter.range,
        from: dateFilter.from,
        to: dateFilter.to,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const getAdminAnalyticsDetails = async (req, res) => {
  try {
    const { dateFilter, roleFilter } = buildFilters(req.query);
    const userMatch = { createdAt: dateFilter.createdAt };
    if (roleFilter) {
      userMatch.role = roleFilter;
    }

    const includeBoardings = roleFilter !== 'student';
    const boardingMatch = includeBoardings ? { createdAt: dateFilter.createdAt } : { _id: null };
    const inquiryMatch = { createdAt: dateFilter.createdAt };
    if (roleFilter) {
      inquiryMatch.role = roleFilter;
    }

    const [userDistribution, inquiryStatus, boardingStatus, topPenalized, penaltyDistribution, recentUsers, recentBoardings, recentInquiries] = await Promise.all([
      User.aggregate([
        { $match: userMatch },
        { $match: { role: { $in: ['student', 'owner', 'admin'] } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Inquiry.aggregate([
        { $match: inquiryMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Boarding.aggregate([
        { $match: boardingMatch },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ['$status', 'approved'] }, 'Active', 'Inactive'],
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Boarding.find({ ...boardingMatch, penaltyPoints: { $gt: 0 } })
        .sort({ penaltyPoints: -1, updatedAt: -1 })
        .limit(6)
        .populate('owner', 'name')
        .select('title owner penaltyPoints status updatedAt')
        .lean(),
      Boarding.aggregate([
        { $match: { ...boardingMatch, penaltyPoints: { $gt: 0 } } },
        {
          $bucket: {
            groupBy: '$penaltyPoints',
            boundaries: [1, 3, 6],
            default: 'others',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      User.find(userMatch)
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name email role createdAt')
        .lean(),
      Boarding.find(boardingMatch)
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('owner', 'name')
        .select('title owner status penaltyPoints createdAt')
        .lean(),
      Inquiry.find(inquiryMatch)
        .sort({ createdAt: -1 })
        .limit(8)
        .select('title category status role createdAt')
        .lean(),
    ]);

    return res.json({
      userDistribution,
      inquiryStatus,
      boardingStatus,
      penaltyInsights: {
        topPenalized: topPenalized.map((item) => ({
          id: item._id,
          title: item.title,
          ownerName: item.owner?.name || 'N/A',
          status: item.status,
          penaltyPoints: item.penaltyPoints || 0,
          updatedAt: item.updatedAt,
        })),
        penaltyDistribution,
      },
      recentActivity: {
        users: recentUsers,
        boardings: recentBoardings.map((item) => ({
          id: item._id,
          title: item.title,
          ownerName: item.owner?.name || 'N/A',
          status: item.status,
          penaltyPoints: item.penaltyPoints || 0,
          createdAt: item.createdAt,
        })),
        inquiries: recentInquiries,
      },
      filters: {
        role: roleFilter || 'all',
        range: dateFilter.range,
        from: dateFilter.from,
        to: dateFilter.to,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const getAdminAnalyticsReportData = async (req, res) => {
  try {
    const { dateFilter, roleFilter } = buildFilters(req.query);
    const userMatch = { createdAt: dateFilter.createdAt };
    if (roleFilter) {
      userMatch.role = roleFilter;
    }

    const includeBoardings = roleFilter !== 'student';
    const boardingMatch = includeBoardings ? { createdAt: dateFilter.createdAt } : { _id: null };
    const inquiryMatch = { createdAt: dateFilter.createdAt };
    if (roleFilter) {
      inquiryMatch.role = roleFilter;
    }

    const [users, boardings, inquiries, summary] = await Promise.all([
      User.find(userMatch)
        .sort({ createdAt: -1 })
        .select('name email role createdAt')
        .lean(),
      Boarding.find(boardingMatch)
        .sort({ createdAt: -1 })
        .populate('owner', 'name')
        .select('title owner status penaltyPoints createdAt')
        .lean(),
      Inquiry.find(inquiryMatch)
        .sort({ createdAt: -1 })
        .select('title category status role createdAt')
        .lean(),
      Promise.all([
        User.countDocuments(userMatch),
        Boarding.countDocuments(boardingMatch),
        Inquiry.countDocuments(inquiryMatch),
        Review.countDocuments({ createdAt: dateFilter.createdAt }),
        Boarding.countDocuments({ ...boardingMatch, penaltyPoints: { $gt: 0 } }),
      ]),
    ]);

    return res.json({
      summary: {
        totalUsers: summary[0],
        totalBoardings: summary[1],
        totalInquiries: summary[2],
        totalReviews: summary[3],
        totalPenalties: summary[4],
      },
      users: users.map((item) => ({
        name: item.name,
        email: item.email,
        role: item.role,
        createdAt: item.createdAt,
      })),
      boardings: boardings.map((item) => ({
        title: item.title,
        ownerName: item.owner?.name || 'N/A',
        status: item.status,
        penaltyPoints: item.penaltyPoints || 0,
        createdAt: item.createdAt,
      })),
      inquiries: inquiries.map((item) => ({
        title: item.title,
        category: item.category || 'N/A',
        status: item.status,
        role: item.role,
        createdAt: item.createdAt,
      })),
      penalties: boardings
        .filter((item) => (item.penaltyPoints || 0) > 0)
        .map((item) => ({
          boarding: item.title,
          ownerName: item.owner?.name || 'N/A',
          penaltyPoints: item.penaltyPoints || 0,
          status: item.status,
        })),
      filters: {
        role: roleFilter || 'all',
        range: dateFilter.range,
        from: dateFilter.from,
        to: dateFilter.to,
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = {
  getAdminAnalyticsSummary,
  getAdminAnalyticsDetails,
  getAdminAnalyticsReportData,
};