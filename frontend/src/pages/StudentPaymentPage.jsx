import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createCardPayment, getMyBookings, getMyPayments } from '../api/api';

const formatCardInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digitsOnly.replace(/(.{4})/g, '$1 ').trim();
};

const validatePaymentForm = (form, currentYear) => {
  const errors = {};

  const name = String(form.cardholderName || '').trim();
  if (!name) {
    errors.cardholderName = 'Cardholder name is required.';
  } else if (name.length > 32) {
    errors.cardholderName = 'Cardholder name must be 32 characters or less.';
  } else if (!/^[A-Za-z ]+$/.test(name)) {
    errors.cardholderName = 'Cardholder name can contain only letters and spaces.';
  }

  const cardDigits = String(form.cardNumber || '').replace(/\D/g, '');
  if (!cardDigits) {
    errors.cardNumber = 'Card number is required.';
  } else if (!/^\d{16}$/.test(cardDigits)) {
    errors.cardNumber = 'Card number must be exactly 16 digits.';
  }

  const month = String(form.expiryMonth || '').trim();
  if (!month) {
    errors.expiryMonth = 'Expiry month is required.';
  } else if (!/^\d{1,2}$/.test(month) || Number(month) < 1 || Number(month) > 12) {
    errors.expiryMonth = 'Month must be between 1 and 12.';
  }

  const year = String(form.expiryYear || '').trim();
  if (!year) {
    errors.expiryYear = 'Expiry year is required.';
  } else if (!/^\d{4}$/.test(year)) {
    errors.expiryYear = 'Year must be 4 digits.';
  } else if (Number(year) < currentYear) {
    errors.expiryYear = `Year cannot be less than ${currentYear}.`;
  }

  const cvv = String(form.cvv || '').trim();
  if (!cvv) {
    errors.cvv = 'CVV is required.';
  } else if (!/^\d{3}$/.test(cvv)) {
    errors.cvv = 'CVV must be exactly 3 digits.';
  }

  return errors;
};

const detectCardBrand = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'unknown';
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  return 'card';
};

const renderBrandLogo = (brand) => {
  if (brand === 'visa') {
    return <span className="font-black tracking-wide text-[#1A1F71]">VISA</span>;
  }

  if (brand === 'mastercard') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-4 w-7">
          <span className="absolute left-0 top-0 inline-block h-4 w-4 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 top-0 inline-block h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
        </div>
        <span className="font-semibold lowercase tracking-tight text-gray-700">mastercard</span>
      </div>
    );
  }

  if (brand === 'amex') {
    return <span className="font-bold tracking-wide text-[#2E77BC]">AMEX</span>;
  }

  if (brand === 'discover') {
    return <span className="font-bold tracking-wide text-[#F76E1E]">DISCOVER</span>;
  }

  return <span className="font-semibold tracking-wide text-gray-600">CARD</span>;
};

const StudentPaymentPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [hasActiveStay, setHasActiveStay] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [error, setError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [form, setForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsRes, paymentsRes] = await Promise.all([getMyBookings(), getMyPayments()]);
        const bookings = bookingsRes.data || [];
        const payments = paymentsRes.data || [];

        const matched = bookings.find((b) => b._id === bookingId);
        if (!matched) {
          setError('Booking not found for payment.');
          return;
        }

        const hasCurrentStay = bookings.some((b) => b.status === 'student_stayed');
        const paidIds = new Set(
          payments
            .filter((p) => p?.status === 'succeeded' && (p?.booking?._id || p?.booking))
            .map((p) => (p?.booking?._id ? p.booking._id : p.booking))
        );

        setBooking(matched);
        setHasActiveStay(hasCurrentStay);
        setAlreadyPaid(paidIds.has(bookingId));

        if (matched.status !== 'visit_completed') {
          setError('Payment is available only for visit-completed bookings.');
        }
      } catch (err) {
        setError(err?.message || 'Failed to load booking for payment.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  const amount = useMemo(() => Number(booking?.boarding?.monthlyRent || 0), [booking]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const validationErrors = useMemo(() => validatePaymentForm(form, currentYear), [form, currentYear]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isBlocked = hasActiveStay || alreadyPaid || !booking || booking?.status !== 'visit_completed' || !!error;
  const cardBrand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber]);

  const previewNumber = useMemo(() => {
    const digits = String(form.cardNumber || '').replace(/\D/g, '').slice(0, 16);
    const padded = `${digits}${'x'.repeat(Math.max(0, 16 - digits.length))}`;
    return padded.replace(/(.{4})/g, '$1 ').trim().toUpperCase();
  }, [form.cardNumber]);

  const previewHolder = useMemo(() => {
    const clean = String(form.cardholderName || '').trim();
    return clean ? clean.toUpperCase() : 'CARD HOLDER';
  }, [form.cardholderName]);

  const previewExpiry = useMemo(() => {
    const mm = form.expiryMonth ? form.expiryMonth.padStart(2, '0') : 'MM';
    const yy = form.expiryYear ? form.expiryYear.slice(-2) : 'YY';
    return `${mm}/${yy}`;
  }, [form.expiryMonth, form.expiryYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitAttempted(true);

    if (isBlocked || hasValidationErrors) return;

    try {
      setSubmitting(true);
      await createCardPayment({
        bookingId,
        amount,
        cardholderName: form.cardholderName.trim(),
        cardNumber: form.cardNumber.replace(/\D/g, ''),
        expiryMonth: form.expiryMonth.trim(),
        expiryYear: form.expiryYear.trim(),
        cvv: form.cvv.trim()
      });

      window.alert('Payment completed. The owner can now confirm your stay.');
      navigate('/student-dashboard', { state: { activeMenu: 'my-boardings' } });
    } catch (err) {
      window.alert(err?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow border border-red-100 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-700">Only students can access the payment page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 flex items-center justify-center text-gray-700">Loading payment details...</div>;
  }

  return (
    <div className="relative overflow-hidden bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-28 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />

      <div className="relative max-w-5xl mx-auto">
        <div className="mb-5">
          <Link to="/student-dashboard" className="text-indigo-600 hover:underline text-sm font-medium">
            Back to Student Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-lg p-5 sm:p-7">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Secure Card Payment</h1>
            <p className="mt-2 text-sm text-slate-600">Pay the first month fee to unlock owner stay confirmation.</p>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 p-5 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div className="rounded-md bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                  Virtual Card
                </div>
                <div className="rounded-md bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {cardBrand === 'unknown' ? 'Accepted Cards' : cardBrand}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-inner" />
                <div className="h-7 w-8 rounded-md border border-white/30" />
              </div>

              <p className="mt-6 text-lg sm:text-xl font-semibold tracking-[0.18em]">{previewNumber}</p>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">Card holder</p>
                  <p className="text-sm font-semibold tracking-wide">{previewHolder}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">Expires</p>
                  <p className="text-sm font-semibold tracking-wide">{previewExpiry}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Accepted:</span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{renderBrandLogo('visa')}</span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{renderBrandLogo('mastercard')}</span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{renderBrandLogo('amex')}</span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">{renderBrandLogo('discover')}</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">Boarding</p>
                <p className="mt-1 text-sm font-semibold text-indigo-900">{booking?.boarding?.title || 'Boarding'}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Amount</p>
                <p className="mt-1 text-lg font-black text-emerald-900">LKR {amount.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-lg p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {renderBrandLogo(cardBrand)}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">Test mode: use 1234123412341234 or 4242424242424242 (non-production only).</p>

            {alreadyPaid && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm">
                Payment already completed for this booking.
              </div>
            )}

            {hasActiveStay && (
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 text-sm">
                You already have an active stay. You can pay and confirm a new stay only after leaving your current boarding.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {submitAttempted && hasValidationErrors && (
                <div className="rounded-lg bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm">
                  Please fix the highlighted fields before continuing.
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Cardholder name</label>
                <input
                  type="text"
                  value={form.cardholderName}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    cardholderName: e.target.value.replace(/[^A-Za-z ]/g, '').slice(0, 25)
                  }))}
                  placeholder="John Doe"
                  className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                    submitAttempted && validationErrors.cardholderName ? 'border-red-400' : 'border-slate-300'
                  }`}
                  required
                  maxLength={32}
                  disabled={isBlocked || submitting}
                />
                {submitAttempted && validationErrors.cardholderName && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.cardholderName}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Card number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, cardNumber: formatCardInput(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  className={`w-full border rounded-xl px-3 py-2.5 tracking-[0.12em] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                    submitAttempted && validationErrors.cardNumber ? 'border-red-400' : 'border-slate-300'
                  }`}
                  required
                  disabled={isBlocked || submitting}
                />
                {submitAttempted && validationErrors.cardNumber && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Month</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.expiryMonth}
                    onChange={(e) => setForm((prev) => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    placeholder="MM"
                    className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                      submitAttempted && validationErrors.expiryMonth ? 'border-red-400' : 'border-slate-300'
                    }`}
                    required
                    maxLength={2}
                    disabled={isBlocked || submitting}
                  />
                  {submitAttempted && validationErrors.expiryMonth && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.expiryMonth}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Year</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.expiryYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="YYYY"
                    className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                      submitAttempted && validationErrors.expiryYear ? 'border-red-400' : 'border-slate-300'
                    }`}
                    required
                    maxLength={4}
                    disabled={isBlocked || submitting}
                  />
                  {submitAttempted && validationErrors.expiryYear && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.expiryYear}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={form.cvv}
                    onChange={(e) => setForm((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    placeholder="123"
                    className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                      submitAttempted && validationErrors.cvv ? 'border-red-400' : 'border-slate-300'
                    }`}
                    required
                    disabled={isBlocked || submitting}
                  />
                  {submitAttempted && validationErrors.cvv && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/student-dashboard', { state: { activeMenu: 'my-boardings' } })}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  disabled={isBlocked || submitting}
                >
                  {submitting ? 'Processing...' : 'Pay and Confirm Stay'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentPaymentPage;
