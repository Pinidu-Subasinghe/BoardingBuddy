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

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-600 text-center">
          {step === 'email' && 'Enter your email to receive an OTP.'}
          {step === 'otp' && 'Enter the 6-digit OTP sent to your email.'}
          {step === 'reset' && 'Set your new password.'}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4" noValidate>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
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
                  className="h-11 w-11 text-center rounded-md border border-slate-300 text-base outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">OTP verifies automatically after entering 6 digits.</p>
          </div>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4" noValidate>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ForgotPassword;
