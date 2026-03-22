const Boarding = require('../models/Boarding');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const InspectorRating = require('../models/InspectorRating');

const getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const boardings = await Boarding.find({ owner: ownerId })
      .select('_id title totalCapacity availableCapacity status city monthlyRent createdAt')
      .lean();

    const boardingIds = boardings.map((b) => b._id);

    const totals = {
      totalBoardings: boardings.length,
      totalVisits: 0,
      averageRating: 0,
      occupancyRate: 0,
      totalCapacity: 0,
      occupiedSlots: 0,
      activeStays: 0,
    };

    if (boardingIds.length === 0) {
      return res.json({
        ...totals,
        bookingStatusBreakdown: {
          requested: 0,
          visit_completed: 0,
          student_stayed: 0,
          closed: 0,
          left: 0,
        },
        recentBookings: [],
        monthlyVisitTrend: [],
        topBoardingsByOccupancy: [],
      });
    }

    const [
      totalVisits,
      statusCounts,
      activeStays,
      reviews,
      inspectorRatings,
      recentBookings,
      monthlyVisitTrend,
    ] = await Promise.all([
      Booking.countDocuments({ owner: ownerId }),
      Booking.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.countDocuments({ owner: ownerId, status: 'student_stayed' }),
      Review.find({ boarding: { $in: boardingIds } }).select('overallRating').lean(),
      InspectorRating.find({ boarding: { $in: boardingIds } }).select('overallPercentage').lean(),
      Booking.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name')
        .populate('boarding', 'title city')
        .select('status createdAt requestedAt stayStart stayEnd boarding student')
        .lean(),
      Booking.aggregate([
        {
          $match: {
            owner: ownerId,
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalCapacity = boardings.reduce((acc, b) => acc + (Number(b.totalCapacity) || 0), 0);
    const occupiedSlots = boardings.reduce((acc, b) => {
      const total = Number(b.totalCapacity) || 0;
      const available = Number(b.availableCapacity);
      const safeAvailable = Number.isFinite(available) ? Math.max(0, available) : total;
      const occupied = Math.max(0, total - safeAvailable);
      return acc + occupied;
    }, 0);

    const reviewAvg = reviews.length
      ? reviews.reduce((acc, r) => acc + (Number(r.overallRating) || 0), 0) / reviews.length
      : null;

    const inspectorAvg = inspectorRatings.length
      ? inspectorRatings.reduce((acc, r) => acc + (Number(r.overallPercentage) || 0), 0) / inspectorRatings.length
      : null;

    let averageRating = 0;
    if (reviewAvg !== null && inspectorAvg !== null) {
      averageRating = (reviewAvg + inspectorAvg) / 2;
    } else if (reviewAvg !== null) {
      averageRating = reviewAvg;
    } else if (inspectorAvg !== null) {
      averageRating = inspectorAvg;
    }

    const occupancyRate = totalCapacity > 0 ? (occupiedSlots / totalCapacity) * 100 : 0;

    const bookingStatusBreakdown = {
      requested: 0,
      visit_completed: 0,
      student_stayed: 0,
      closed: 0,
      left: 0,
    };

    statusCounts.forEach((row) => {
      if (row && row._id && Object.prototype.hasOwnProperty.call(bookingStatusBreakdown, row._id)) {
        bookingStatusBreakdown[row._id] = row.count;
      }
    });

    const topBoardingsByOccupancy = boardings
      .map((b) => {
        const total = Number(b.totalCapacity) || 0;
        const available = Number(b.availableCapacity);
        const safeAvailable = Number.isFinite(available) ? Math.max(0, available) : total;
        const occupied = Math.max(0, total - safeAvailable);
        const occupancy = total > 0 ? (occupied / total) * 100 : 0;
        return {
          id: b._id,
          title: b.title,
          city: b.city,
          occupancyRate: Number(occupancy.toFixed(1)),
          occupiedSlots: occupied,
          totalCapacity: total,
          status: b.status,
        };
      })
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5);

    const trendMap = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendMap.set(key, { month: key, count: 0 });
    }

    monthlyVisitTrend.forEach((row) => {
      const monthKey = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      if (trendMap.has(monthKey)) {
        trendMap.set(monthKey, { month: monthKey, count: row.count });
      }
    });

    return res.json({
      totalBoardings: totals.totalBoardings,
      totalVisits,
      averageRating: Number(averageRating.toFixed(1)),
      occupancyRate: Number(occupancyRate.toFixed(1)),
      totalCapacity,
      occupiedSlots,
      activeStays,
      bookingStatusBreakdown,
      recentBookings: recentBookings.map((b) => ({
        id: b._id,
        status: b.status,
        createdAt: b.createdAt,
        requestedAt: b.requestedAt,
        stayStart: b.stayStart,
        stayEnd: b.stayEnd,
        studentName: b.student?.name || 'N/A',
        boardingTitle: b.boarding?.title || 'N/A',
        boardingCity: b.boarding?.city || 'N/A',
      })),
      monthlyVisitTrend: Array.from(trendMap.values()),
      topBoardingsByOccupancy,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOwnerAnalytics,
};