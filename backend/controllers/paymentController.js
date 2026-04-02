const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Boarding = require('../models/Boarding');
const Payment = require('../models/Payment');
const { addNotification } = require('../utils/notification');

const luhnCheck = (cardNumber) => {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

const getCardBrand = (cardNumber) => {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(cardNumber)) return 'visa';
  if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(cardNumber)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(cardNumber)) return 'amex';
  if (/^6(?:011|5\d{2})\d{12}$/.test(cardNumber)) return 'discover';
  return 'unknown';
};

const isCardExpired = (month, year) => {
  const now = new Date();
  const expiry = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
  return expiry < now;
};

const createCardPayment = async (req, res) => {
  try {
    const { bookingId, amount, cardNumber, cardholderName, expiryMonth, expiryYear, cvv } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Valid bookingId is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    if (booking.status !== 'visit_completed') {
      return res.status(400).json({ message: 'Card payment is available only after visit completion' });
    }

    const activeStay = await Booking.findOne({ student: req.user._id, status: 'student_stayed' });
    if (activeStay) {
      return res.status(400).json({
        message: 'You already have an active stay. You can pay for a new stay only after leaving your current boarding.'
      });
    }

    const existingSuccess = await Payment.findOne({
      booking: booking._id,
      student: req.user._id,
      status: 'succeeded'
    });
    if (existingSuccess) {
      return res.status(409).json({ message: 'Payment already completed for this booking' });
    }

    const boarding = await Boarding.findById(booking.boarding).select('monthlyRent title owner');
    if (!boarding) return res.status(404).json({ message: 'Boarding not found' });

    const sanitizedCardNumber = String(cardNumber || '').replace(/\s|-/g, '');
    const devTestCards = new Set(['1234123412341234', '4242424242424242']);
    const isDevTestCard = process.env.NODE_ENV !== 'production' && devTestCards.has(sanitizedCardNumber);
    if (!/^\d{16}$/.test(sanitizedCardNumber) || (!luhnCheck(sanitizedCardNumber) && !isDevTestCard)) {
      return res.status(400).json({ message: 'Invalid card number' });
    }

    const normalizedCvv = String(cvv || '').trim();
    if (!/^\d{3}$/.test(normalizedCvv)) {
      return res.status(400).json({ message: 'Invalid CVV' });
    }

    const normalizedMonth = Number(expiryMonth);
    const normalizedYear = Number(expiryYear);
    if (!Number.isInteger(normalizedMonth) || normalizedMonth < 1 || normalizedMonth > 12) {
      return res.status(400).json({ message: 'Invalid expiry month' });
    }
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(normalizedYear) || normalizedYear < currentYear) {
      return res.status(400).json({ message: 'Invalid expiry year' });
    }
    if (isCardExpired(normalizedMonth, normalizedYear)) {
      return res.status(400).json({ message: 'Card is expired' });
    }

    const normalizedHolder = String(cardholderName || '').trim();
    if (!normalizedHolder) {
      return res.status(400).json({ message: 'Cardholder name is required' });
    }
    if (normalizedHolder.length > 25 || !/^[A-Za-z ]+$/.test(normalizedHolder)) {
      return res.status(400).json({ message: 'Cardholder name must contain only letters and be 25 characters or less' });
    }

    // Student pays only the first month before owner confirms stay.
    const expectedAmount = Number(boarding.monthlyRent);
    const normalizedAmount = amount !== undefined ? Number(amount) : expectedAmount;

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (Math.abs(normalizedAmount - expectedAmount) > 0.01) {
      return res.status(400).json({
        message: `Amount mismatch. Expected amount is ${expectedAmount.toFixed(2)}`
      });
    }

    const payment = await Payment.create({
      booking: booking._id,
      boarding: boarding._id,
      student: booking.student,
      owner: booking.owner,
      amount: Number(normalizedAmount.toFixed(2)),
      currency: 'LKR',
      method: 'card',
      status: 'succeeded',
      transactionId: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      cardBrand: getCardBrand(sanitizedCardNumber),
      cardLast4: sanitizedCardNumber.slice(-4),
      cardholderName: normalizedHolder,
      expiryMonth: normalizedMonth,
      expiryYear: normalizedYear,
      paidAt: new Date()
    });

    try {
      addNotification({
        userId: booking.owner,
        message: `Payment received for ${boarding.title}`,
        type: 'payment_received',
        data: {
          paymentId: payment._id.toString(),
          bookingId: booking._id.toString(),
          amount: payment.amount
        }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('boarding', 'title address city')
      .populate('booking', 'status stayStart stayEnd periodMonths')
      .sort({ createdAt: -1 });

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOwnerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ owner: req.user._id })
      .populate('student', 'name email contactNumber')
      .populate('boarding', 'title address city')
      .populate('booking', 'status stayStart stayEnd periodMonths')
      .sort({ createdAt: -1 });

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid payment id' });
    }

    const payment = await Payment.findById(id)
      .populate('student', 'name email')
      .populate('owner', 'name email')
      .populate('boarding', 'title address city')
      .populate('booking', 'status stayStart stayEnd periodMonths');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const userId = req.user._id.toString();
    const isParticipant =
      payment.student._id.toString() === userId ||
      payment.owner._id.toString() === userId ||
      req.user.role === 'admin';

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCardPayment,
  getMyPayments,
  getOwnerPayments,
  getPaymentById
};