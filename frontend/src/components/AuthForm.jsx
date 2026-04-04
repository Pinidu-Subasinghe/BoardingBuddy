import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import universities from '../data/universities.json';
import { AuthContext } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const MOBILE_REGEX = /^0\d{9}$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;
const TEN_DIGIT_REGEX = /^\d{10}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{12,16}$/;

const toDateInputMax = () => new Date().toISOString().split('T')[0];

const formatAccountNumber = (digits = '') => {
  const chunks = digits.match(/\d{1,4}/g);
  return chunks ? chunks.join(' ') : '';
};

const isValidPastOrTodayDate = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed <= today;
};

const AuthForm = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register, verifyOtp } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [guardianExpanded, setGuardianExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [bankOptions, setBankOptions] = useState([]);
  const otpInputRefs = useRef([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    contactNumber: '',
    role: 'student',
    university: '',
    dob: '',
    guardianType: 'Father',
    guardianName: '',
    guardianPhone: '',
    paymentAccountNumber: '',
    paymentBankName: '',
    paymentBranchName: '',
    paymentAccountHolderName: ''
  });

  const universityOptions = useMemo(() => Object.entries(universities), []);

  useEffect(() => {
    let active = true;

    const loadBankOptions = async () => {
      try {
        const response = await fetch('/data/bank-options.json');
        if (!response.ok) {
          throw new Error(`Failed to load bank options: ${response.status}`);
        }

        const data = await response.json();
        if (!active) return;
        setBankOptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading bank options', error);
        if (active) setBankOptions([]);
      }
    };

    loadBankOptions();

    return () => {
      active = false;
    };
  }, []);

  const navigateByRole = (role) => {
    switch (role) {
      case 'student':
        navigate('/');
        break;
      case 'owner':
        navigate('/owner-dashboard');
        break;
      case 'inspector':
        navigate('/inspector-dashboard');
        break;
      case 'admin':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const switchAuthMode = (nextLoginState) => {
    setIsLogin(nextLoginState);
    setErrors({});
    setFormError('');
    navigate(nextLoginState ? '/login' : '/signup');
  };

  const inputClass = (hasError) => {
    if (isLogin) {
      return `w-full border-0 border-b bg-transparent px-1 py-2.5 text-sm outline-none transition ${
        hasError
          ? 'border-red-500 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-900'
      }`;
    }

    return `w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;
  };

  const submitButtonClass = isLogin
    ? 'w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:bg-gray-500'
    : 'w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-indigo-300';

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      let digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly[0] !== '0') {
        digitsOnly = `0${digitsOnly}`;
      }
      digitsOnly = digitsOnly.slice(0, 10);
      setFormData((prev) => ({ ...prev, contactNumber: digitsOnly }));
      setErrors((prev) => ({ ...prev, contactNumber: '' }));
      return;
    }

    if (name === 'guardianPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, guardianPhone: digitsOnly }));
      setErrors((prev) => ({ ...prev, guardianPhone: '' }));
      return;
    }

    if (name === 'paymentAccountNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
      setFormData((prev) => ({ ...prev, paymentAccountNumber: digitsOnly }));
      setErrors((prev) => ({ ...prev, paymentAccountNumber: '' }));
      return;
    }

    if (name === 'name') {
      const lettersOnly = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
      setFormData((prev) => ({ ...prev, name: lettersOnly }));
      setErrors((prev) => ({ ...prev, name: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (isLogin) {
      if (!formData.password) {
        nextErrors.password = 'Password is required';
      }
      return nextErrors;
    }

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (!NAME_REGEX.test(formData.name.trim())) {
      nextErrors.name = 'Name must contain only English letters';
    }

    if (!formData.contactNumber) {
      nextErrors.contactNumber = 'Mobile number is required';
    } else if (!MOBILE_REGEX.test(formData.contactNumber)) {
      nextErrors.contactNumber = 'Mobile number must start with 0 and be 10 digits';
    }

    if (!formData.dob) {
      nextErrors.dob = 'Date of birth is required';
    } else if (!isValidPastOrTodayDate(formData.dob)) {
      nextErrors.dob = 'Date of birth cannot be in the future';
    }

    if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      nextErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'student') {
      if (!formData.university) {
        nextErrors.university = 'Select your university from the dropdown';
      }
      if (!formData.guardianName.trim()) {
        nextErrors.guardianName = 'Guardian name is required';
      }
      if (!formData.guardianPhone) {
        nextErrors.guardianPhone = 'Guardian phone is required';
      } else if (!TEN_DIGIT_REGEX.test(formData.guardianPhone)) {
        nextErrors.guardianPhone = 'Guardian phone must be exactly 10 digits';
      }
    }

    if (formData.role === 'owner') {
      if (!formData.paymentAccountNumber) {
        nextErrors.paymentAccountNumber = 'Account number is required';
      } else if (!ACCOUNT_NUMBER_REGEX.test(formData.paymentAccountNumber)) {
        nextErrors.paymentAccountNumber = 'Account number must be 12 to 16 digits';
      }
      if (!formData.paymentBankName) {
        nextErrors.paymentBankName = 'Bank name is required';
      }
      if (!formData.paymentBranchName.trim()) {
        nextErrors.paymentBranchName = 'Branch name is required';
      }
      if (!formData.paymentAccountHolderName.trim()) {
        nextErrors.paymentAccountHolderName = 'Account holder name is required';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      if (!isLogin && formData.role === 'student' && (validationErrors.guardianName || validationErrors.guardianPhone)) {
        setGuardianExpanded(true);
      }
      if (!isLogin && formData.role === 'owner' && (
        validationErrors.paymentAccountNumber
        || validationErrors.paymentBankName
        || validationErrors.paymentBranchName
        || validationErrors.paymentAccountHolderName
      )) {
        setPaymentExpanded(true);
      }
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      if (isLogin) {
        const userData = await login({ email: formData.email, password: formData.password });
        await Swal.fire({
          title: 'Signed in!',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
        });
        navigateByRole(userData.role);
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        role: formData.role,
        university: formData.university,
        dob: formData.dob,
      };

      if (formData.role === 'student') {
        payload.guardian = {
          type: formData.guardianType,
          name: formData.guardianName,
          phone: formData.guardianPhone,
        };
      }

      if (formData.role === 'owner') {
        payload.paymentDetails = {
          accountNumber: formData.paymentAccountNumber,
          bankName: formData.paymentBankName,
          branchName: formData.paymentBranchName,
          accountHolderName: formData.paymentAccountHolderName,
        };
      }

      const registerResult = await register(payload);
      setPendingEmail(registerResult.email || formData.email.trim().toLowerCase());
      setOtpCode('');
      setOtpError('');
      setShowOtpModal(true);
      await Swal.fire({ title: 'Verify your email', text: 'An OTP has been sent to your email.', icon: 'info' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error occurred';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        setErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
      }
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpValue = otpCode) => {
    if (otpValue.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    if (isVerifyingOtp) return;

    try {
      setIsVerifyingOtp(true);
      const userData = await verifyOtp({ email: pendingEmail, otp: otpValue });
      await Swal.fire({ title: 'Account verified', icon: 'success' });
      setShowOtpModal(false);
      navigateByRole(userData.role);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed';
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const digitsOnly = value.replace(/\D/g, '');

    if (!digitsOnly) {
      if (index < otpCode.length) {
        const next = otpCode.slice(0, index) + otpCode.slice(index + 1);
        setOtpCode(next);
      }
      setOtpError('');
      return;
    }

    if (index > otpCode.length) return;

    const digit = digitsOnly.slice(-1);
    let next;

    if (index === otpCode.length) {
      next = (otpCode + digit).slice(0, 6);
    } else {
      next = (otpCode.slice(0, index) + digit + otpCode.slice(index + 1)).slice(0, 6);
    }

    setOtpCode(next);
    setOtpError('');

    if (next.length === 6) {
      handleVerifyOtp(next);
    }

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpCode[index]) {
        e.preventDefault();
        const next = otpCode.slice(0, index) + otpCode.slice(index + 1);
        setOtpCode(next);
        return;
      }

      if (index > 0) {
        e.preventDefault();
        otpInputRefs.current[index - 1]?.focus();
        const next = otpCode.slice(0, index - 1) + otpCode.slice(index);
        setOtpCode(next);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setOtpCode(pasted);
    setOtpError('');
    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  return (
    <div className="w-full max-w-[30rem]">
      <p className="text-2xl font-bold text-gray-900">BoardingBuddy</p>

      <h2 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900">
        {isLogin ? 'Welcome Back!' : 'Create your account'}
      </h2>

      <p className="mt-1 text-sm text-gray-600 mb-5">
        {isLogin ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => switchAuthMode(false)}
              className="font-semibold text-gray-800 underline underline-offset-2 hover:text-black"
            >
              Create a new account now
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchAuthMode(true)}
              className="font-semibold text-gray-800 underline underline-offset-2 hover:text-black"
            >
              Sign in now
            </button>
          </>
        )}
      </p>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" aria-live="polite">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {!isLogin && (
          <>
            <div>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" maxLength={30} className={inputClass(errors.name)} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass(false)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <div>
                <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Phone" inputMode="numeric" maxLength={10} className={inputClass(errors.contactNumber)} />
                {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
              </div>
            </div>

            <div>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} max={toDateInputMax()} className={inputClass(errors.dob)} />
              {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
            </div>

            <select name="role" value={formData.role} onChange={handleChange} className={inputClass(false)}>
              <option value="student">Student</option>
              <option value="owner">Boarding Owner</option>
            </select>

            {formData.role === 'student' && (
              <>
                <div>
                  <select name="university" value={formData.university} onChange={handleChange} className={inputClass(errors.university)}>
                    <option value="" disabled>Select university</option>
                    {universityOptions.map(([code, name]) => (
                      <option key={code} value={code}>{code} - {name}</option>
                    ))}
                  </select>
                  {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <button type="button" onClick={() => setGuardianExpanded((prev) => !prev)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    <span>Guardian Details</span>
                    <span className="text-gray-500">{guardianExpanded ? '-' : '+'}</span>
                  </button>
                  {guardianExpanded && (
                    <div className="space-y-3 mt-3">
                      <select name="guardianType" value={formData.guardianType} onChange={handleChange} className={inputClass(false)}>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Other">Other</option>
                      </select>
                      <div>
                        <input name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="Guardian name" className={inputClass(errors.guardianName)} />
                        {errors.guardianName && <p className="text-xs text-red-500 mt-1">{errors.guardianName}</p>}
                      </div>
                      <div>
                        <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="Guardian phone" inputMode="numeric" maxLength={10} className={inputClass(errors.guardianPhone)} />
                        {errors.guardianPhone && <p className="text-xs text-red-500 mt-1">{errors.guardianPhone}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.role === 'owner' && (
              <div className="rounded-lg border border-gray-200 p-3">
                <button type="button" onClick={() => setPaymentExpanded((prev) => !prev)} className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  <span>Payment Details</span>
                  <span className="text-gray-500">{paymentExpanded ? '-' : '+'}</span>
                </button>
                {paymentExpanded && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <input name="paymentAccountNumber" value={formatAccountNumber(formData.paymentAccountNumber)} onChange={handleChange} placeholder="Account number" inputMode="numeric" className={inputClass(errors.paymentAccountNumber)} />
                      {errors.paymentAccountNumber && <p className="text-xs text-red-500 mt-1">{errors.paymentAccountNumber}</p>}
                    </div>
                    <div>
                      <input name="paymentAccountHolderName" value={formData.paymentAccountHolderName} onChange={handleChange} placeholder="Account holder name" className={inputClass(errors.paymentAccountHolderName)} />
                      {errors.paymentAccountHolderName && <p className="text-xs text-red-500 mt-1">{errors.paymentAccountHolderName}</p>}
                    </div>
                    <div>
                      <select name="paymentBankName" value={formData.paymentBankName} onChange={handleChange} className={inputClass(errors.paymentBankName)}>
                        <option value="" disabled>Select bank</option>
                        {bankOptions.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                      </select>
                      {errors.paymentBankName && <p className="text-xs text-red-500 mt-1">{errors.paymentBankName}</p>}
                    </div>
                    <div>
                      <input name="paymentBranchName" value={formData.paymentBranchName} onChange={handleChange} placeholder="Branch name" className={inputClass(errors.paymentBranchName)} />
                      {errors.paymentBranchName && <p className="text-xs text-red-500 mt-1">{errors.paymentBranchName}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputClass(errors.email)} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Password" className={`${inputClass(errors.password)} pr-10`} />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.41-.59M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 4 10 7a10.94 10.94 0 01-3.04 4.06M6.1 6.1A11.98 11.98 0 002 12c1 3 5 7 10 7 1.58 0 3.09-.4 4.42-1.1" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {isLogin && (
          <div className="text-center -mt-1">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
              Forgot password <span className="font-semibold underline underline-offset-2">Click here</span>
            </button>
          </div>
        )}

        {!isLogin && (
          <div>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className={`${inputClass(errors.confirmPassword)} pr-10`} />
              <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.41-.59M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 4 10 7a10.94 10.94 0 01-3.04 4.06M6.1 6.1A11.98 11.98 0 002 12c1 3 5 7 10 7 1.58 0 3.09-.4 4.42-1.1" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
          {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Verify Your Email</h3>
            <p className="text-xs text-gray-600 text-center mb-4">Enter the 6-digit OTP sent to {pendingEmail}</p>
            <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  value={otpCode[index] || ''}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={index === 0}
                  className={`h-11 w-11 text-center border rounded-md text-base focus:ring-2 focus:ring-indigo-500 outline-none ${otpError ? 'border-red-500' : 'border-gray-300'}`}
                />
              ))}
            </div>
            {otpError && <p className="text-xs text-red-500 mt-2 text-center">{otpError}</p>}
            <p className="text-xs text-gray-500 mt-2 text-center">OTP verifies automatically after entering 6 digits.</p>
            <div className="mt-4">
              <button type="button" onClick={() => setShowOtpModal(false)} disabled={isVerifyingOtp} className="w-full py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
