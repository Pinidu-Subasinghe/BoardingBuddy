import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createBankTransferPayment, createCardPayment, getMyBookings, getMyPayments } from '../api/api';
import Swal from 'sweetalert2';
import LoadingAnimation from '../components/LoadingAnimation';
import PaymentReceipt, { downloadPaymentReceiptPdf } from '../components/PaymentReceipt';

const formatCardInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digitsOnly.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiryInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digitsOnly.length <= 2) return digitsOnly;
  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
};

const formatAccountNumber = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  if (!digitsOnly) return 'N/A';
  return digitsOnly.replace(/(.{4})/g, '$1 ').trim();
};

const parseExpiry = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digitsOnly.length !== 4) return null;

  const month = Number(digitsOnly.slice(0, 2));
  const yearTwoDigits = Number(digitsOnly.slice(2, 4));
  const yearFull = 2000 + yearTwoDigits;

  return {
    month,
    monthText: digitsOnly.slice(0, 2),
    yearTwoDigits,
    yearFull,
    yearFullText: String(yearFull),
  };
};

const validatePaymentForm = (form, currentYear, currentMonth) => {
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

  const expiry = String(form.expiry || '').trim();
  if (!expiry) {
    errors.expiry = 'Expiry is required.';
  } else {
    const parsedExpiry = parseExpiry(expiry);
    if (!parsedExpiry) {
      errors.expiry = 'Use MM/YY format (example: 12/26).';
    } else if (parsedExpiry.month < 1 || parsedExpiry.month > 12) {
      errors.expiry = 'Month must be between 01 and 12.';
    } else if (
      parsedExpiry.yearFull < currentYear ||
      (parsedExpiry.yearFull === currentYear && parsedExpiry.month < currentMonth)
    ) {
      errors.expiry = 'Card is expired. Use a valid expiry date.';
    }
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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [slipImageFile, setSlipImageFile] = useState(null);
  const [slipValidationError, setSlipValidationError] = useState('');
  const slipInputRef = useRef(null);
  const [form, setForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsRes, paymentsRes] = await Promise.all([getMyBookings(), getMyPayments()]);
        const bookings = bookingsRes.data || [];
        const payments = Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : Array.isArray(paymentsRes.data?.payments)
            ? paymentsRes.data.payments
            : [];

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
  const { currentYear, currentMonth } = useMemo(() => {
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 };
  }, []);
  const validationErrors = useMemo(
    () => validatePaymentForm(form, currentYear, currentMonth),
    [form, currentYear, currentMonth]
  );
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isBlocked = hasActiveStay || alreadyPaid || !booking || booking?.status !== 'visit_completed' || !!error;
  const cardBrand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber]);
  const ownerPaymentDetails = booking?.boarding?.owner?.paymentDetails || null;
  const hasOwnerBankDetails =
    !!ownerPaymentDetails?.accountNumber &&
    !!ownerPaymentDetails?.bankName &&
    !!ownerPaymentDetails?.branchName &&
    !!ownerPaymentDetails?.accountHolderName;

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
    const digitsOnly = String(form.expiry || '').replace(/\D/g, '').slice(0, 4);
    if (!digitsOnly) return 'MM/YY';
    if (digitsOnly.length <= 2) return `${digitsOnly.padEnd(2, 'M')}/YY`;
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2).padEnd(2, 'Y')}`;
  }, [form.expiry]);

  const buildReceiptData = (paymentRecord = {}, methodOverride = paymentMethod) => {
    return {
      boardingName: booking?.boarding?.title || 'Boarding',
      studentName: user?.name || 'Student',
      amount: Number(paymentRecord?.amount ?? amount ?? 0),
      method: paymentRecord?.method || methodOverride,
      paymentId: paymentRecord?.transactionId || paymentRecord?._id || bookingId,
      bookingId,
      paidAt: paymentRecord?.paidAt || paymentRecord?.createdAt || new Date().toISOString(),
      status: paymentRecord?.status || 'succeeded',
      payeeName: booking?.boarding?.owner?.name || ownerPaymentDetails?.accountHolderName || 'Boarding Owner',
      accountNumber: ownerPaymentDetails?.accountNumber || '',
      bankName: ownerPaymentDetails?.bankName || 'N/A',
      branchName: ownerPaymentDetails?.branchName || 'N/A',
      currency: paymentRecord?.currency || 'LKR',
    };
  };

  const showReceiptDialog = async (receiptData, title, description) => {
    let receiptRoot = null;

    const result = await Swal.fire({
      title,
      html: `
        <p style="margin: 0 0 12px; color: #475569; font-size: 0.92rem;">
          ${description}
        </p>
        <div id="payment-receipt-preview" style="max-width: 620px; margin: 0 auto;"></div>
      `,
      width: 760,
      showCancelButton: true,
      confirmButtonText: 'Download Receipt',
      cancelButtonText: 'Continue',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      focusConfirm: true,
      allowOutsideClick: false,
      didOpen: () => {
        const previewContainer = Swal.getHtmlContainer()?.querySelector('#payment-receipt-preview');
        if (previewContainer) {
          receiptRoot = createRoot(previewContainer);
          receiptRoot.render(
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <PaymentReceipt receipt={receiptData} />
            </div>
          );
        }
      },
      willClose: () => {
        if (receiptRoot) {
          receiptRoot.unmount();
          receiptRoot = null;
        }
      },
    });

    if (!result.isConfirmed) return;

    try {
      await downloadPaymentReceiptPdf(receiptData);
    } catch (downloadError) {
      await Swal.fire({
        title: 'Receipt download failed',
        text: downloadError?.message || 'Unable to generate receipt PDF right now.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitAttempted(true);

    if (isBlocked) return;

    try {
      let paymentResponse = null;
      let successTitle = 'Payment completed';
      let successDescription = 'The owner can now confirm your stay.';

      if (paymentMethod === 'card') {
        if (hasValidationErrors) {
          const parsedExpiry = parseExpiry(form.expiry);
          const hasExpiredCard =
            !!parsedExpiry &&
            parsedExpiry.month >= 1 &&
            parsedExpiry.month <= 12 &&
            (parsedExpiry.yearFull < currentYear ||
              (parsedExpiry.yearFull === currentYear && parsedExpiry.month < currentMonth));

          if (hasExpiredCard) {
            await Swal.fire({
              title: 'Card expired',
              text: 'Please use a card with a valid expiry date.',
              icon: 'warning',
              confirmButtonColor: '#f59e0b',
            });
          }

          return;
        }

        const parsedExpiry = parseExpiry(form.expiry);
        if (!parsedExpiry) {
          await Swal.fire({
            title: 'Invalid expiry',
            text: 'Please enter expiry in MM/YY format.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b',
          });
          return;
        }

        setSubmitting(true);
        paymentResponse = await createCardPayment({
          bookingId,
          amount,
          cardholderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber.replace(/\D/g, ''),
          expiryMonth: parsedExpiry.monthText,
          expiryYear: parsedExpiry.yearFullText,
          cvv: form.cvv.trim()
        });
      } else {
        if (!hasOwnerBankDetails) {
          await Swal.fire({
            title: 'Bank details unavailable',
            text: 'Owner bank details are missing. Please use card payment or contact support.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b',
          });
          return;
        }

        if (!slipImageFile) {
          setSlipValidationError('Payment slip image is required.');
          return;
        }

        setSubmitting(true);
        const payload = new FormData();
        payload.append('bookingId', bookingId);
        payload.append('amount', String(amount));
        payload.append('slipImage', slipImageFile);

        paymentResponse = await createBankTransferPayment(payload);
        successTitle = 'Slip uploaded';
        successDescription = 'Bank transfer payment submitted successfully.';
      }

      const receiptData = buildReceiptData(paymentResponse?.data, paymentMethod);
      await showReceiptDialog(receiptData, successTitle, successDescription);

      navigate('/student-dashboard', { state: { activeMenu: 'my-boardings' } });
    } catch (err) {
      await Swal.fire({
        title: 'Payment failed',
        text: err?.response?.data?.message || err?.message || 'Payment failed',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSlipFileChange = (event) => {
    const file = event.target.files?.[0];
    setSlipValidationError('');

    if (!file) {
      setSlipImageFile(null);
      return;
    }

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(String(file.type || '').toLowerCase())) {
      setSlipImageFile(null);
      setSlipValidationError('Supported formats: JPG, JPEG, PNG, WEBP.');
      event.target.value = '';
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setSlipImageFile(null);
      setSlipValidationError('Image must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    setSlipImageFile(file);
  };

  const handleRemoveSlipFile = () => {
    setSlipImageFile(null);
    setSlipValidationError('');
    if (slipInputRef.current) {
      slipInputRef.current.value = '';
    }
  };

  const switchPaymentMethod = (method) => {
    setPaymentMethod(method);
    setSubmitAttempted(false);
    setSlipValidationError('');
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
    return <LoadingAnimation text="Loading payment details..." containerClassName="py-16" />;
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
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {paymentMethod === 'card' ? 'Secure Card Payment' : 'Bank Transfer Payment'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {paymentMethod === 'card'
                ? 'Pay the first month fee to unlock owner stay confirmation.'
                : 'Transfer the first month fee to owner bank account and upload your payment slip.'}
            </p>

            {paymentMethod === 'card' ? (
              <>
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
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <p className="text-sm font-semibold">How to complete bank transfer</p>
                <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-emerald-900/90">
                  <li>Use the bank details shown on the right panel.</li>
                  <li>Transfer the exact amount shown below.</li>
                  <li>Upload a clear screenshot/photo of your transfer slip.</li>
                </ol>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">Boarding</p>
                <p className="mt-1 text-sm font-semibold text-indigo-900">{booking?.boarding?.title || 'Boarding'}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Amount LKR</p>
                <p className="mt-1 text-lg font-black text-emerald-900">{amount.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-lg p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {paymentMethod === 'card' ? renderBrandLogo(cardBrand) : 'BANK TRANSFER'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchPaymentMethod('card')}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                disabled={submitting}
              >
                Card Payment
              </button>
              <button
                type="button"
                onClick={() => switchPaymentMethod('bank_transfer')}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                disabled={submitting}
              >
                Bank Transfer
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <p className="mt-3 text-xs text-slate-500">Test mode: use 1234123412341234 or 4242424242424242 (non-production only).</p>
            ) : (
              <>
              </>
            )}

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

            {paymentMethod === 'bank_transfer' && !hasOwnerBankDetails && !isBlocked && (
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 text-sm">
                Owner bank details are not available. Please choose card payment for now.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {paymentMethod === 'card' && submitAttempted && hasValidationErrors && (
                <div className="rounded-lg bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm">
                  Please fix the highlighted fields before continuing.
                </div>
              )}

              {paymentMethod === 'bank_transfer' && submitAttempted && !slipImageFile && (
                <div className="rounded-lg bg-red-50 border border-red-300 text-red-800 px-4 py-3 text-sm">
                  Please upload your transfer slip image before continuing.
                </div>
              )}

              {paymentMethod === 'card' ? (
                <>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.expiry}
                        onChange={(e) => setForm((prev) => ({ ...prev, expiry: formatExpiryInput(e.target.value) }))}
                        placeholder="MM/YY"
                        className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${
                          submitAttempted && validationErrors.expiry ? 'border-red-400' : 'border-slate-300'
                        }`}
                        required
                        maxLength={5}
                        disabled={isBlocked || submitting}
                      />
                      {submitAttempted && validationErrors.expiry && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.expiry}</p>
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
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-slate-800">Owner Bank Details</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div>
                        <span className="font-medium">Account Holder:</span>{' '}
                        {ownerPaymentDetails?.accountHolderName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Bank:</span> {ownerPaymentDetails?.bankName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Branch:</span> {ownerPaymentDetails?.branchName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span>{' '}
                        {formatAccountNumber(ownerPaymentDetails?.accountNumber)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload transfer slip image</label>
                    <input
                      ref={slipInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleSlipFileChange}
                      className={`w-full border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 ${
                        submitAttempted && (!slipImageFile || slipValidationError) ? 'border-red-400' : 'border-slate-300'
                      }`}
                      disabled={isBlocked || submitting || !hasOwnerBankDetails}
                    />
                    <p className="mt-1 text-xs text-slate-500">Accepted formats: JPG, JPEG, PNG, WEBP. Max 5MB.</p>
                    {slipImageFile && (
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-xs text-emerald-700 font-medium">Selected file: {slipImageFile.name}</p>
                        <button
                          type="button"
                          onClick={handleRemoveSlipFile}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline disabled:opacity-60"
                          disabled={submitting}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {slipValidationError && (
                      <p className="mt-1 text-xs text-red-600">{slipValidationError}</p>
                    )}
                  </div>
                </>
              )}

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
                  disabled={isBlocked || submitting || (paymentMethod === 'bank_transfer' && !hasOwnerBankDetails)}
                >
                  {submitting
                    ? paymentMethod === 'card'
                      ? 'Processing...'
                      : 'Submitting...'
                    : paymentMethod === 'card'
                      ? 'Pay and Confirm Stay'
                      : 'Submit Transfer Slip'}
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
