const Inquiry = require('../models/Inquiry');
const Boarding = require('../models/Boarding');
const User = require('../models/User');
const { sendTransactionalEmail } = require('../utils/email');
const { addNotification } = require('../utils/notification');

const STATUS_VALUES = ['Pending', 'In Review', 'Resolved', 'Rejected'];
const CATEGORY_VALUES = ['Property Issue', 'System Issue', 'Other'];
const ALLOWED_ROLES = ['student', 'owner', 'inspector'];

const sendEmailSafe = async (payload, label) => {
  try {
    await sendTransactionalEmail(payload);
  } catch (err) {
    console.error(`${label} email error:`, err);
  }
};

// User: create inquiry
const createInquiry = async (req, res) => {
  try {
    const { title, description, category, boardingId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    const role = req.user.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const requiresCategory = role === 'student' || role === 'inspector';
    if (requiresCategory && !category) {
      return res.status(400).json({ message: 'category is required' });
    }
    if (category && !CATEGORY_VALUES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    let resolvedBoardingId;
    let resolvedOwnerId;
    if (requiresCategory && boardingId) {
      const boarding = await Boarding.findById(boardingId).select('_id owner');
      if (!boarding) {
        return res.status(404).json({ message: 'Boarding not found' });
      }
      resolvedBoardingId = boarding._id;
      resolvedOwnerId = boarding.owner;
    }

    const inquiry = await Inquiry.create({
      title,
      description,
      category: requiresCategory ? category : undefined,
      status: 'Pending',
      userId: req.user._id,
      role,
      boardingId: resolvedBoardingId,
      ownerId: resolvedOwnerId,
    });

    const message = `Dear ${req.user.name},\n\n` +
      'Your inquiry has been successfully submitted.\n' +
      'Our admin team will review it shortly.\n\n' +
      'Thank you for reaching out.\n\n' +
      'Thank You,\n' +
      'BoardingBuddy \u{1F3E0} Team';

    sendEmailSafe(
      {
        to: req.user.email,
        subject: 'Inquiry Received - BoardingBuddy \u{1F3E0}',
        text: message,
      },
      'Inquiry submitted'
    );

    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      admins.forEach((admin) => {
        addNotification({
          userId: admin._id,
          message: 'You have a new inquiry. Check inquiry section.',
          type: 'new_inquiry',
          data: { inquiryId: inquiry._id.toString() },
        });
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.status(201).json(inquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User: get own inquiries
const getMyInquiries = async (req, res) => {
  try {
    const role = req.user.role;
    const filters =
      role === 'owner'
        ? {
            $or: [
              { userId: req.user._id },
              {
                ownerId: req.user._id,
                ownerWarningMessage: { $exists: true, $ne: '' },
              },
            ],
          }
        : { userId: req.user._id };

    const inquiries = await Inquiry.find(filters)
      .populate('boardingId', 'title penaltyPoints penaltyNote')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: get all inquiries
const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('userId', 'name email role')
      .populate('boardingId', 'title penaltyPoints penaltyNote owner')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: update inquiry status
const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    inquiry.status = status;
    await inquiry.save();

    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: add response to inquiry
const addAdminResponse = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response || !String(response).trim()) {
      return res.status(400).json({ message: 'response is required' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    inquiry.adminResponse = response;
    await inquiry.save();

    const user = await User.findById(inquiry.userId).select('name email');
    if (user) {
      const message = `Dear ${user.name},\n\n` +
        'Your inquiry has been reviewed.\n\n' +
        'Admin Response:\n' +
        `${response}\n\n` +
        'Thank you for your patience.\n\n' +
        'Thank You,\n' +
        'BoardingBuddy \u{1F3E0} Team';

      sendEmailSafe(
        {
          to: user.email,
          subject: 'Update on Your Inquiry',
          text: message,
        },
        'Inquiry response'
      );
    }

    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: apply penalty points
const applyPenaltyPoints = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (!inquiry.boardingId) {
      return res.status(400).json({ message: 'Inquiry has no boarding to penalize' });
    }

    const points = Number(req.body.points);
    const penaltyNote = req.body.penaltyNote || '';
    const ownerWarningMessage = req.body.ownerWarningMessage || '';
    if (![0, 1, 2, 3, 4, 5].includes(points)) {
      return res.status(400).json({ message: 'points must be between 0 and 5' });
    }

    const boarding = await Boarding.findById(inquiry.boardingId);
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    boarding.penaltyPoints = points;
    boarding.penaltyNote = penaltyNote;
    await boarding.save();

    inquiry.penaltyNote = penaltyNote || inquiry.penaltyNote;
    inquiry.ownerId = inquiry.ownerId || boarding.owner;
    if (ownerWarningMessage) {
      inquiry.ownerWarningMessage = ownerWarningMessage;
      inquiry.ownerWarningAt = new Date();
    }
    await inquiry.save();

    const user = await User.findById(inquiry.userId).select('name email');
    if (user) {
      const message = `Dear ${user.name},\n\n` +
        'Appropriate action has been taken regarding your inquiry.\n\n' +
        'Thank you for helping us maintain quality standards.\n\n' +
        'Thank You,\n' +
        'BoardingBuddy \u{1F3E0} Team';

      sendEmailSafe(
        {
          to: user.email,
          subject: 'Action Taken on Your Inquiry',
          text: message,
        },
        'Inquiry penalty'
      );
    }

    res.json({
      message: 'Penalty points applied',
      boardingId: boarding._id,
      penaltyPoints: boarding.penaltyPoints,
      penaltyNote: boarding.penaltyNote,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User/Admin: delete inquiry
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwnerWarning = inquiry.ownerId && inquiry.ownerId.toString() === req.user._id.toString();
    const isCreator = inquiry.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator && !isOwnerWarning) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Inquiry.deleteOne({ _id: inquiry._id });
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  updateInquiryStatus,
  addAdminResponse,
  applyPenaltyPoints,
  deleteInquiry,
};
