const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  boarding: { type: mongoose.Schema.Types.ObjectId, ref: 'Boarding', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  method: { type: String, enum: ['card', 'bank_transfer'], default: 'card' },
  status: { type: String, enum: ['succeeded', 'failed', 'pending'], default: 'succeeded' },
  transactionId: { type: String, required: true, unique: true },
  cardBrand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'discover', 'unknown'],
    default: 'unknown'
  },
  cardLast4: {
    type: String,
    required: function () {
      return this.method === 'card';
    }
  },
  cardholderName: {
    type: String,
    required: function () {
      return this.method === 'card';
    }
  },
  expiryMonth: {
    type: Number,
    min: 1,
    max: 12,
    required: function () {
      return this.method === 'card';
    }
  },
  expiryYear: {
    type: Number,
    required: function () {
      return this.method === 'card';
    }
  },
  slipImageUrl: { type: String },
  slipImagePublicId: { type: String },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ owner: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);