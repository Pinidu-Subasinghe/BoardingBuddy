const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Property Issue', 'System Issue', 'Other'],
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'owner', 'inspector'],
      required: true,
    },
    boardingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boarding',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminResponse: { type: String },
    penaltyNote: { type: String },
    ownerWarningMessage: { type: String },
    ownerWarningAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
