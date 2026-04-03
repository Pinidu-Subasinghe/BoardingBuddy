import React, { useState, useContext, useRef } from 'react';
import universities from '../data/universities.json';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

// Client-side submit validation rules for auth fields.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const MOBILE_REGEX = /^0\d{9}$/;
const NAME_REGEX = /^[A-Za-z\s]+$/;
const TEN_DIGIT_REGEX = /^\d{10}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{12,16}$/;

const BANK_OPTIONS = [
  'Amana Bank PLC',
  'Bank of Ceylon (BOC)',
  'Cargills Bank Limited',
  'Commercial Bank of Ceylon PLC',
  'DFCC Bank PLC',
  'Hatton National Bank PLC (HNB)',
  'HSBC (Hongkong and Shanghai Banking Corporation)',
  'National Development Bank PLC (NDB)',
  'Nations Trust Bank PLC (NTB)',
  'Pan Asia Banking Corporation PLC',
  "People's Bank",
  'Sampath Bank PLC',
  'Seylan Bank PLC',
  'Standard Chartered Bank',
  'Union Bank of Colombo PLC'
];

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

const AuthForm = () => {
  const { login, register, verifyOtp, closeAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [guardianExpanded, setGuardianExpanded] = useState(true);
  const [paymentExpanded, setPaymentExpanded] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
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

  const [errors, setErrors] = useState({});

  const navigateByRole = (role) => {
    if (role && role !== 'student') {
      switch (role) {
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
    }
  };

  const universityOptions = Object.entries(universities);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      let digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly[0] !== '0') {
        digitsOnly = `0${digitsOnly}`;
      }
      digitsOnly = digitsOnly.slice(0, 10);
      setFormData({ ...formData, contactNumber: digitsOnly });
      setErrors((prev) => ({ ...prev, contactNumber: '' }));
      return;
    }

    if (name === 'guardianPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, guardianPhone: digitsOnly });
      setErrors((prev) => ({ ...prev, guardianPhone: '' }));
      return;
    }

    if (name === 'paymentAccountNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
      setFormData({ ...formData, paymentAccountNumber: digitsOnly });
      setErrors((prev) => ({ ...prev, paymentAccountNumber: '' }));
      return;
    }

    if (name === 'name') {
      const lettersOnly = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
      setFormData({ ...formData, name: lettersOnly });
      return;
    }

    setFormData({ ...formData, [name]: value });
    if (
      name === 'email' ||
      name === 'dob' ||
      name === 'guardianName' ||
      name === 'paymentBankName' ||
      name === 'paymentBranchName' ||
      name === 'paymentAccountHolderName'
    ) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!isLogin) {
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
        nextErrors.password =
          'Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)';
      }

      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Confirm Password is required';
      } else if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match';
      }

      if (formData.role === 'student') {
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
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isLogin) {
        const userData = await login({ email: formData.email, password: formData.password });
        Swal.fire({ title: 'Signed in!', icon: 'success', draggable: true });
        closeAuth();
        navigateByRole(userData.role);
      } else {
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
        Swal.fire({ title: 'Verify your email', text: 'An OTP has been sent to your email.', icon: 'info', draggable: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error occurred';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        setErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
      } else {
        Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      }
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

    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    setOtpCode(pasted);
    setOtpError('');
    const nextFocusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    try {
      const userData = await verifyOtp({ email: pendingEmail, otp: otpCode });
      Swal.fire({ title: 'Account verified', icon: 'success', draggable: true });
      setShowOtpModal(false);
      closeAuth();
      navigateByRole(userData.role);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed';
      setOtpError(msg);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-5 sm:p-6 relative mx-auto">
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow focus:outline-none"
          aria-label="Close auth form"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-5">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                maxLength={30}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.name ? 'border-red-500' : ''}`}
                required
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}

              <div className="flex gap-2">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <div className="w-1/2">
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="Phone"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      handleChange(e);
                      setErrors((prev) => ({ ...prev, contactNumber: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.contactNumber ? 'border-red-500' : ''}`}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                  {errors.contactNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={toDateInputMax()}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.dob ? 'border-red-500' : ''}`}
                  required
                />
                {errors.dob && (
                  <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                )}
              </div>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="student">Student</option>
                <option value="owner">Boarding Owner</option>
              </select>

              {formData.role === 'student' && (
                <>
                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="" disabled>Select university</option>
                    {universityOptions.map(([code, name]) => (
                      <option key={code} value={code}>
                        {code} - {name}
                      </option>
                    ))}
                  </select>

                  <div className="border border-gray-200 rounded-lg p-3">
                    <button
                      type="button"
                      onClick={() => setGuardianExpanded((prev) => !prev)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide"
                    >
                      <span>Guardian Details</span>
                      <span className="text-gray-500">{guardianExpanded ? '−' : '+'}</span>
                    </button>
                    {guardianExpanded && (
                      <div className="space-y-2 mt-3">
                        <select
                          name="guardianType"
                          value={formData.guardianType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Other">Other</option>
                        </select>

                        <div>
                          <input
                            type="text"
                            name="guardianName"
                            placeholder="Guardian name"
                            value={formData.guardianName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.guardianName ? 'border-red-500' : ''}`}
                            required
                          />
                          {errors.guardianName && (
                            <p className="text-xs text-red-500 mt-1">{errors.guardianName}</p>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            name="guardianPhone"
                            placeholder="Guardian phone"
                            value={formData.guardianPhone}
                            onChange={handleChange}
                            inputMode="numeric"
                            maxLength={10}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.guardianPhone ? 'border-red-500' : ''}`}
                            required
                          />
                          {errors.guardianPhone && (
                            <p className="text-xs text-red-500 mt-1">{errors.guardianPhone}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>

              )}

              {formData.role === 'owner' && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={() => setPaymentExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    <span>Payment Details</span>
                    <span className="text-gray-500">{paymentExpanded ? '−' : '+'}</span>
                  </button>
                  {paymentExpanded && (
                    <div className="space-y-2 mt-3">
                      <div>
                        <input
                          type="text"
                          name="paymentAccountNumber"
                          placeholder="Account number"
                          value={formatAccountNumber(formData.paymentAccountNumber)}
                          onChange={handleChange}
                          inputMode="numeric"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.paymentAccountNumber ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.paymentAccountNumber && (
                          <p className="text-xs text-red-500 mt-1">{errors.paymentAccountNumber}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          name="paymentAccountHolderName"
                          placeholder="Account holder name"
                          value={formData.paymentAccountHolderName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.paymentAccountHolderName ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.paymentAccountHolderName && (
                          <p className="text-xs text-red-500 mt-1">{errors.paymentAccountHolderName}</p>
                        )}
                      </div>

                      <div>
                        <select
                          name="paymentBankName"
                          value={formData.paymentBankName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.paymentBankName ? 'border-red-500' : ''}`}
                          required
                        >
                          <option value="" disabled>Select bank</option>
                          {BANK_OPTIONS.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                        {errors.paymentBankName && (
                          <p className="text-xs text-red-500 mt-1">{errors.paymentBankName}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          name="paymentBranchName"
                          placeholder="Branch name"
                          value={formData.paymentBranchName}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.paymentBranchName ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.paymentBranchName && (
                          <p className="text-xs text-red-500 mt-1">{errors.paymentBranchName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.email ? 'border-red-500' : ''}`}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => {
                handleChange(e);
                setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
              }}
              className={`w-full px-3 py-2 pr-10 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.password ? 'border-red-500' : ''}`}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.41-.59M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 4 10 7a10.94 10.94 0 01-3.04 4.06M6.1 6.1A11.98 11.98 0 002 12c1 3 5 7 10 7 1.58 0 3.09-.4 4.42-1.1" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 -mt-2">{errors.password}</p>
          )}

          {!isLogin && (
            <>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  className={`w-full px-3 py-2 pr-10 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required={!isLogin}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.41-.59M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 4 10 7a10.94 10.94 0 01-3.04 4.06M6.1 6.1A11.98 11.98 0 002 12c1 3 5 7 10 7 1.58 0 3.09-.4 4.42-1.1" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 -mt-2">{errors.confirmPassword}</p>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-xs text-gray-600 mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setShowPassword(false);
              setShowConfirmPassword(false);
              setShowOtpModal(false);
              setOtpCode('');
              setOtpError('');
              setErrors({});
            }}
            className="text-indigo-600 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {showOtpModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
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
                    className={`h-11 w-11 text-center border rounded-md text-base focus:ring-2 focus:ring-indigo-500 outline-none ${otpError ? 'border-red-500' : ''}`}
                  />
                ))}
              </div>
              {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-1/2 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-1/2 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthForm;