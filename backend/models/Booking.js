const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  boarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['requested','notified','visit_completed','student_stayed','closed','left'], default: 'requested' },
  requestedAt: { type: Date, default: Date.now },
  visitCompletedAt: { type: Date },
  stayStart: { type: Date },
  stayEnd: { type: Date },
  periodMonths: { type: Number },
  closedByRole: { type: String, enum: ['owner', 'student'] },
  note: { type: String }
}, { timestamps: true });

// Ensure a student can have at most one active 'student_stayed' booking
bookingSchema.index({ student: 1 }, { unique: true, partialFilterExpression: { status: 'student_stayed' } });

module.exports = mongoose.model('Booking', bookingSchema);
