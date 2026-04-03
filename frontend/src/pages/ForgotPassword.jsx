import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  forgotPasswordRequest,
  verifyForgotPasswordOtpRequest,
  resetPasswordWithOtpRequest
} from '../api/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpInputRefs = useRef([]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordRequest({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setOtp('');
      setStep('otp');
      await Swal.fire({ title: 'OTP Sent', text: res.data?.message || 'OTP sent to your email', icon: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpValue = async (otpValue) => {
    if (verifying) return;
    try {
      setVerifying(true);
      await verifyForgotPasswordOtpRequest({ email, otp: otpValue });
      setStep('reset');
      await Swal.fire({ title: 'OTP Verified', icon: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP, please re-enter');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const digitsOnly = value.replace(/\D/g, '');

    if (!digitsOnly) {
      if (index < otp.length) {
        const next = otp.slice(0, index) + otp.slice(index + 1);
        setOtp(next);
      }
      setError('');
      return;
    }

    if (index > otp.length) return;

    const digit = digitsOnly.slice(-1);
    let next;

    if (index === otp.length) {
      next = (otp + digit).slice(0, 6);
    } else {
      next = (otp.slice(0, index) + digit + otp.slice(index + 1)).slice(0, 6);
    }

    setOtp(next);
    setError('');

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (next.length === 6) {
      verifyOtpValue(next);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        e.preventDefault();
        const next = otp.slice(0, index) + otp.slice(index + 1);
        setOtp(next);
        return;
      }

      if (index > 0) {
        e.preventDefault();
        otpInputRefs.current[index - 1]?.focus();
        const next = otp.slice(0, index - 1) + otp.slice(index);
        setOtp(next);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setOtp(pasted);
    setError('');
    if (pasted.length === 6) {
      verifyOtpValue(pasted);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithOtpRequest({ email, otp, password, confirmPassword });
      await Swal.fire({
        title: 'Password Reset Successful',
        text: 'You can now sign in with your new password.',
        icon: 'success'
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const stepOrder = ['email', 'otp', 'reset'];
  const currentStepIndex = stepOrder.indexOf(step);
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100';
  const primaryButtonClass = 'w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400';

  return (
    <section className="relative min-h-[calc(100vh-6.5rem)] overflow-hidden bg-[#eef1f7] px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:items-center">
      <div className="pointer-events-none absolute -top-24 -left-24 hidden h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 hidden h-64 w-64 rounded-full bg-sky-200/40 blur-3xl sm:block" />

      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl lg:max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1f2f8b] via-[#3348d8] to-[#4b6dff] p-10 text-white lg:flex lg:min-h-[560px] lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Account Recovery</p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.05]">Reset your password securely</h1>
              <p className="mt-5 text-base leading-relaxed text-white/85">
                We use one-time verification to keep your account safe before allowing any password change.
              </p>
            </div>

            <div className="space-y-3 text-sm text-white/90">
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">1. Submit your registered email</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">2. Enter the 6-digit verification code</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">3. Set a strong new password</div>
            </div>
          </div>

          <div className="bg-[#f8f9fc] p-5 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-bold text-slate-900">BoardingBuddy</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Back to sign in
              </button>
            </div>

            <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">Forgot Password</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {step === 'email' && 'Enter your email to receive a one-time password.'}
              {step === 'otp' && `Enter the 6-digit OTP sent to ${email}.`}
              {step === 'reset' && 'Create a new strong password to complete account recovery.'}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm">
              {stepOrder.map((stepKey, index) => {
                const isActive = step === stepKey;
                const isDone = currentStepIndex > index;

                return (
                  <div
                    key={stepKey}
                    className={`rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {stepKey === 'email' && 'Email'}
                    {stepKey === 'otp' && 'Verify OTP'}
                    {stepKey === 'reset' && 'New Password'}
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="mt-6 space-y-4" noValidate>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className={inputClass}
                />
                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      value={otp[index] || ''}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      inputMode="numeric"
                      maxLength={1}
                      autoFocus={index === 0}
                      disabled={verifying}
                      className="h-12 w-11 rounded-xl border border-slate-300 bg-white text-center text-base font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-12"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center">OTP verifies automatically after entering 6 digits.</p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError('');
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    disabled={verifying}
                  >
                    Change Email
                  </button>
                </div>
              </div>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="mt-6 space-y-4" noValidate>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className={inputClass}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={inputClass}
                />
                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
