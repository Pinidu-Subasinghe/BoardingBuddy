import React, { useState } from 'react';
import Swal from 'sweetalert2';
import universities from '../../data/universities.json';

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

const AdminAddUserModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
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
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const universityOptions = Object.entries(universities);

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
      let digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly[0] !== '0') {
        digitsOnly = `0${digitsOnly}`;
      }
      digitsOnly = digitsOnly.slice(0, 10);
      setForm(prev => ({ ...prev, contactNumber: digitsOnly }));
      setErrors(prev => ({ ...prev, contactNumber: '' }));
      return;
    }

    if (name === 'guardianPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm(prev => ({ ...prev, guardianPhone: digitsOnly }));
      setErrors(prev => ({ ...prev, guardianPhone: '' }));
      return;
    }

    if (name === 'paymentAccountNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
      setForm(prev => ({ ...prev, paymentAccountNumber: digitsOnly }));
      setErrors(prev => ({ ...prev, paymentAccountNumber: '' }));
      return;
    }

    if (name === 'name') {
      const lettersOnly = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
      setForm(prev => ({ ...prev, name: lettersOnly }));
      setErrors(prev => ({ ...prev, name: '' }));
      return;
    }

    if (name === 'role') {
      setForm(prev => ({
        ...prev,
        role: value,
        university: value === 'student' ? prev.university : '',
        guardianType: value === 'student' ? prev.guardianType : 'Father',
        guardianName: value === 'student' ? prev.guardianName : '',
        guardianPhone: value === 'student' ? prev.guardianPhone : '',
        paymentAccountNumber: value === 'owner' ? prev.paymentAccountNumber : '',
        paymentBankName: value === 'owner' ? prev.paymentBankName : '',
        paymentBranchName: value === 'owner' ? prev.paymentBranchName : '',
        paymentAccountHolderName: value === 'owner' ? prev.paymentAccountHolderName : ''
      }));
      setErrors(prev => ({
        ...prev,
        university: '',
        guardianName: '',
        guardianPhone: '',
        paymentAccountNumber: '',
        paymentBankName: '',
        paymentBranchName: '',
        paymentAccountHolderName: ''
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      setEmailError('');
      setErrors(prev => ({ ...prev, email: '' }));
    } else if (name === 'name') {
      setErrors(prev => ({ ...prev, name: '' }));
    } else if (name === 'password') {
      setErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } else if (name === 'confirmPassword') {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    } else if (name === 'university') {
      setErrors(prev => ({ ...prev, university: '' }));
    } else if (name === 'dob') {
      setErrors(prev => ({ ...prev, dob: '' }));
    } else if (name === 'guardianName') {
      setErrors(prev => ({ ...prev, guardianName: '' }));
    } else if (name === 'paymentBankName') {
      setErrors(prev => ({ ...prev, paymentBankName: '' }));
    } else if (name === 'paymentBranchName') {
      setErrors(prev => ({ ...prev, paymentBranchName: '' }));
    } else if (name === 'paymentAccountHolderName') {
      setErrors(prev => ({ ...prev, paymentAccountHolderName: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (!NAME_REGEX.test(form.name.trim())) {
      nextErrors.name = 'Name must contain only English letters';
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!form.contactNumber) {
      nextErrors.contactNumber = 'Mobile number is required';
    } else if (!MOBILE_REGEX.test(form.contactNumber)) {
      nextErrors.contactNumber = 'Mobile number must start with 0 and be 10 digits';
    }

    if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      nextErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm Password is required';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!form.dob) {
      nextErrors.dob = 'Date of birth is required';
    } else if (!isValidPastOrTodayDate(form.dob)) {
      nextErrors.dob = 'Date of birth cannot be in the future';
    }

    if (form.role === 'student' && !form.university) {
      nextErrors.university = 'Select your university from the dropdown';
    }

    if (form.role === 'student') {
      if (!form.guardianName.trim()) {
        nextErrors.guardianName = 'Guardian name is required';
      }
      if (!form.guardianPhone) {
        nextErrors.guardianPhone = 'Guardian phone is required';
      } else if (!TEN_DIGIT_REGEX.test(form.guardianPhone)) {
        nextErrors.guardianPhone = 'Guardian phone must be exactly 10 digits';
      }
    }

    if (form.role === 'owner') {
      if (!form.paymentAccountNumber) {
        nextErrors.paymentAccountNumber = 'Account number is required';
      } else if (!ACCOUNT_NUMBER_REGEX.test(form.paymentAccountNumber)) {
        nextErrors.paymentAccountNumber = 'Account number must be 12 to 16 digits';
      }
      if (!form.paymentBankName) {
        nextErrors.paymentBankName = 'Bank name is required';
      }
      if (!form.paymentBranchName.trim()) {
        nextErrors.paymentBranchName = 'Branch name is required';
      }
      if (!form.paymentAccountHolderName.trim()) {
        nextErrors.paymentAccountHolderName = 'Account holder name is required';
      }
    }

    if (!form.gender) {
      nextErrors.gender = 'Gender is required';
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      // Call onSubmit and wait for it
      const res = await onSubmit({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        gender: form.gender,
        contactNumber: form.contactNumber,
        role: form.role,
        university: form.role === 'student' ? form.university : undefined,
        dob: form.dob,
        guardian: form.role === 'student' ? {
          type: form.guardianType,
          name: form.guardianName,
          phone: form.guardianPhone,
        } : undefined,
        paymentDetails: form.role === 'owner' ? {
          accountNumber: form.paymentAccountNumber,
          bankName: form.paymentBankName,
          branchName: form.paymentBranchName,
          accountHolderName: form.paymentAccountHolderName,
        } : undefined,
      });

      // If error object returned, show friendly error
      if (res && res.error) {
        if (res.error === 'email_exists') {
          setEmailError('Email is already registered');
        } else if (typeof res.error === 'string' && res.error.toLowerCase().includes('university')) {
          setErrors(prev => ({ ...prev, university: 'Select your university from the dropdown' }));
          setError('');
        } else {
          setError(typeof res.error === 'string' ? res.error : 'Error creating user');
        }
        setLoading(false);
        return;
      }

      // Only show success if API returned a user
      if (!res || !res._id) {
        setError('Error creating user');
        setLoading(false);
        return;
      }

      await Swal.fire({
        title: 'User created!',
        icon: 'success',
        draggable: true
      });

      // Reset form
      setForm({
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
      setErrors({});

      onClose();

    } catch (err) {
      setError('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative animate-fadeIn max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-lg"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New User</h2>

        {error && <div className="text-red-600 text-sm mb-3 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              maxLength={30}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.name ? 'border-red-500' : ''}`}
              required
            />
            {errors.name && <span className="text-red-600 text-xs mt-1 block">{errors.name}</span>}
          </div>

          <div>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              type="email"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.email ? 'border-red-500' : ''}`}
              required
            />
            {(errors.email || emailError) && (
              <span className="text-red-600 text-xs mt-1 block">
                {errors.email || emailError}
              </span>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.password ? 'border-red-500' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
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
              <span className="text-red-600 text-xs mt-1 block">{errors.password}</span>
            )}
          </div>

          <div>
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.confirmPassword ? 'border-red-500' : ''}`}
              required
            />
            {errors.confirmPassword && (
              <span className="text-red-600 text-xs mt-1 block">{errors.confirmPassword}</span>
            )}
          </div>

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <div>
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="Contact Number"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.contactNumber ? 'border-red-500' : ''}`}
              inputMode="numeric"
              maxLength={10}
              required
            />
            {errors.contactNumber && (
              <span className="text-red-600 text-xs mt-1 block">{errors.contactNumber}</span>
            )}
          </div>

          <div>
            <input
              name="dob"
              value={form.dob}
              onChange={handleChange}
              type="date"
              max={toDateInputMax()}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.dob ? 'border-red-500' : ''}`}
              required
            />
            {errors.dob && (
              <span className="text-red-600 text-xs mt-1 block">{errors.dob}</span>
            )}
          </div>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="student">Student</option>
            <option value="owner">Owner</option>
            <option value="inspector">Inspector</option>
            <option value="admin">Admin</option>
          </select>

          {form.role === 'student' && (
            <>
              <div>
                <select
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.university ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="" disabled>Select university</option>
                  {universityOptions.map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
                {errors.university && (
                  <span className="text-red-600 text-xs mt-1 block">{errors.university}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  name="guardianType"
                  value={form.guardianType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Other">Other</option>
                </select>

                <div>
                  <input
                    name="guardianName"
                    value={form.guardianName}
                    onChange={handleChange}
                    placeholder="Guardian Name"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.guardianName ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.guardianName && <span className="text-red-600 text-xs mt-1 block">{errors.guardianName}</span>}
                </div>
              </div>

              <div>
                <input
                  name="guardianPhone"
                  value={form.guardianPhone}
                  onChange={handleChange}
                  placeholder="Guardian Phone"
                  inputMode="numeric"
                  maxLength={10}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.guardianPhone ? 'border-red-500' : ''}`}
                  required
                />
                {errors.guardianPhone && <span className="text-red-600 text-xs mt-1 block">{errors.guardianPhone}</span>}
              </div>
            </>
          )}

          {form.role === 'owner' && (
            <>
              <div>
                <input
                  name="paymentAccountNumber"
                  value={formatAccountNumber(form.paymentAccountNumber)}
                  onChange={handleChange}
                  placeholder="Account Number"
                  inputMode="numeric"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.paymentAccountNumber ? 'border-red-500' : ''}`}
                  required
                />
                {errors.paymentAccountNumber && <span className="text-red-600 text-xs mt-1 block">{errors.paymentAccountNumber}</span>}
              </div>

              <div>
                <input
                  name="paymentAccountHolderName"
                  value={form.paymentAccountHolderName}
                  onChange={handleChange}
                  placeholder="Account Holder Name"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.paymentAccountHolderName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.paymentAccountHolderName && <span className="text-red-600 text-xs mt-1 block">{errors.paymentAccountHolderName}</span>}
              </div>

              <div>
                <select
                  name="paymentBankName"
                  value={form.paymentBankName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.paymentBankName ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="" disabled>Select bank</option>
                  {BANK_OPTIONS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                {errors.paymentBankName && <span className="text-red-600 text-xs mt-1 block">{errors.paymentBankName}</span>}
              </div>

              <div>
                <input
                  name="paymentBranchName"
                  value={form.paymentBranchName}
                  onChange={handleChange}
                  placeholder="Branch Name"
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none ${errors.paymentBranchName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.paymentBranchName && <span className="text-red-600 text-xs mt-1 block">{errors.paymentBranchName}</span>}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddUserModal;