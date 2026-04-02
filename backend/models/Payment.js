const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  boarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  method: { type: String, enum: ['card'], default: 'card' },
  status: { type: String, enum: ['succeeded', 'failed'], default: 'succeeded' },
  transactionId: { type: String, required: true, unique: true },
  cardBrand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover', 'unknown'],
    default: 'unknown'
  },
  cardLast4: { type: String, required: true },
  cardholderName: { type: String, required: true },
  expiryMonth: { type: Number, required: true, min: 1, max: 12 },
  expiryYear: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ owner: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);