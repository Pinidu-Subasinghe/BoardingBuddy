const Booking = require('../models/Booking');
const Boarding = require('../models/Boarding');
const Payment = require('../models/Payment');
const { addNotification } = require('../utils/notification');
const CANCEL_WINDOW_MS = 30 * 60 * 1000;

// Student: request visit -> create booking
const createBooking = async (req, res) => {
  try {
    const { boardingId, note } = req.body;
    const boarding = await Boarding.findById(boardingId);
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    // Prevent duplicate booking requests for the same boarding by the same student unless previous is closed
    const existing = await Booking.findOne({
      boarding: boarding._id,
      student: req.user._id,
      status: { $in: ['requested', 'visit_completed', 'student_stayed', 'notified'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending or active booking for this boarding. Please wait until the owner closes it.' });
    }

    const booking = await Booking.create({
      boarding: boarding._id,
      student: req.user._id,
      owner: boarding.owner,
      status: 'requested',
      note
    });

    try {
      addNotification({
        userId: boarding.owner,
        message: `New visit request for ${boarding.title}`,
        type: 'visit_requested',
        data: { boardingId: boarding._id.toString(), bookingId: booking._id.toString() }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: get own bookings (all)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate({
        path: 'boarding',
        populate: {
          path: 'owner',
          select: 'name email contactNumber',
        },
      });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: get bookings for their boardings
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id }).populate('boarding student');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: cancel visit request within 30 minutes of creation, then delete record
const cancelVisitRequest = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['requested', 'notified'].includes(booking.status)) {
      return res.status(400).json({ message: 'Only active visit requests can be canceled' });
    }

    const requestedAt = booking.requestedAt || booking.createdAt;
    const elapsed = Date.now() - new Date(requestedAt).getTime();
    if (elapsed > CANCEL_WINDOW_MS) {
      return res.status(400).json({ message: 'Cancellation window expired. Visit request can only be canceled within 30 minutes.' });
    }

    const ownerId = booking.owner;
    const boardingId = booking.boarding;
    const bookingId = booking._id;

    await Booking.deleteOne({ _id: booking._id });

    try {
      addNotification({
        userId: ownerId,
        message: 'A student canceled a visit request within the allowed time window.',
        type: 'visit_canceled',
        data: { bookingId: bookingId.toString(), boardingId: boardingId.toString() }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    return res.json({ message: 'Visit request canceled and removed.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Owner: mark visit completed (sets visitCompletedAt and status to visit_completed)
const markVisitCompleted = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    booking.status = 'visit_completed';
    booking.visitCompletedAt = new Date();
    await booking.save();
    try {
      const visitDate = booking.visitCompletedAt.toDateString();
      addNotification({
        userId: booking.student,
        message: `Your visit was completed on ${visitDate}.`,
        type: 'visit_completed',
        data: { bookingId: booking._id.toString(), boardingId: booking.boarding.toString() }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: confirm stay with start date and period months -> set stayStart, stayEnd, periodMonths and status student_stayed; decrement boarding.availableCapacity
const confirmStay = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'visit_completed') {
      return res.status(400).json({ message: 'Stay can only be confirmed after visit completion' });
    }

    const payment = await Payment.findOne({ booking: booking._id, status: 'succeeded' });
    if (!payment) {
      return res.status(400).json({ message: 'Cannot confirm stay until first month payment is received' });
    }

    const { startDate, periodMonths } = req.body;
    if (!startDate || !periodMonths) return res.status(400).json({ message: 'startDate and periodMonths required' });

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(periodMonths));

      // Prevent student from staying in more than one boarding at a time
      const existingStay = await Booking.findOne({ student: booking.student, status: 'student_stayed' });
      if (existingStay && existingStay._id.toString() !== booking._id.toString()) {
        return res.status(400).json({ message: 'Student is already staying at another boarding' });
      }

      booking.stayStart = start;
      booking.periodMonths = Number(periodMonths);
      booking.stayEnd = end;
      booking.status = 'student_stayed';
      await booking.save();

    // decrement boarding availableCapacity
    const boarding = await Boarding.findById(booking.boarding);
    if (boarding) {
      boarding.availableCapacity = Math.max(0, (boarding.availableCapacity || boarding.totalCapacity) - 1);
      await boarding.save();
    }

    try {
      addNotification({
        userId: booking.student,
        message: `Stay confirmed from ${start.toDateString()} for ${Number(periodMonths)} month(s).`,
        type: 'stay_confirmed',
        data: {
          bookingId: booking._id.toString(),
          boardingId: booking.boarding.toString(),
          stayStart: start.toISOString(),
          periodMonths: Number(periodMonths)
        }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: close visit without stay
const closeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    booking.status = 'closed';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: extend stay (update stayEnd)
const extendStay = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'student_stayed') return res.status(400).json({ message: 'Can only extend ongoing stays.' });

    const { newEndDate } = req.body;
    if (!newEndDate) return res.status(400).json({ message: 'newEndDate required' });
    const newEnd = new Date(newEndDate);
    if (newEnd <= new Date(booking.stayEnd)) return res.status(400).json({ message: 'New end date must be after current end date.' });

    booking.stayEnd = newEnd;
    await booking.save();
    try {
      addNotification({
        userId: booking.student,
        message: `Your stay has been extended until ${newEnd.toDateString()}.`,
        type: 'stay_extended',
        data: {
          bookingId: booking._id.toString(),
          boardingId: booking.boarding.toString(),
          stayEnd: newEnd.toISOString()
        }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: end stay (student leaves, update status, increment capacity)
const endStay = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status !== 'student_stayed') return res.status(400).json({ message: 'Can only end ongoing stays.' });

    booking.status = 'left';
    await booking.save();

    // increment boarding availableCapacity
    const boarding = await Boarding.findById(booking.boarding);
    if (boarding) {
      boarding.availableCapacity = Math.min(boarding.totalCapacity, (boarding.availableCapacity || 0) + 1);
      await boarding.save();
    }

    // Notify student to review
    try {
      addNotification({
        userId: booking.student,
        message: `Please review your stay at ${boarding?.title || 'the boarding'}`,
        type: 'review_request',
        data: { boardingId: boarding?._id ? boarding._id.toString() : null, bookingId: booking._id.toString() }
      });
    } catch (notifyErr) {
      // Log notification error but don't block main flow
      console.error('Notification error:', notifyErr);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  cancelVisitRequest,
  markVisitCompleted,
  confirmStay,
  closeBooking,
  extendStay,
  endStay
};
