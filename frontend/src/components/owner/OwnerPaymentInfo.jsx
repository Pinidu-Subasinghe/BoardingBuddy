import React, { useContext, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile } from '../../api/api';

const ACCOUNT_NUMBER_REGEX = /^\d{12,16}$/;
const ACCOUNT_HOLDER_REGEX = /^[A-Za-z\s]+$/;

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const formatAccountNumber = (value = '') => {
  const digitsOnly = String(value).replace(/\D/g, '');
  const chunks = digitsOnly.match(/\d{1,4}/g);
  return chunks ? chunks.join(' ') : '';
};

const hasPaymentDetails = (paymentDetails) => {
  return Boolean(
    paymentDetails?.accountNumber &&
    paymentDetails?.bankName &&
    paymentDetails?.branchName &&
    paymentDetails?.accountHolderName
  );
};

const normalizeDetails = (paymentDetails = {}) => {
  return {
    accountNumber: String(paymentDetails.accountNumber || '').replace(/\D/g, '').slice(0, 16),
    bankName: String(paymentDetails.bankName || '').trim(),
    branchName: String(paymentDetails.branchName || '').trim(),
    accountHolderName: String(paymentDetails.accountHolderName || '').trim(),
  };
};

const OwnerPaymentInfo = () => {
  const { user: contextUser } = useContext(AuthContext);
  const user = getCurrentUser() || contextUser;

  const initialDetails = useMemo(
    () => normalizeDetails(user?.paymentDetails),
    [user?.paymentDetails]
  );

  const [form, setForm] = useState(initialDetails);
  const [savedDetails, setSavedDetails] = useState(initialDetails);
  const [errors, setErrors] = useState({});
  const [bankOptions, setBankOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadBankOptions = async () => {
      try {
        const response = await fetch('/data/bank-options.json');
        if (!response.ok) throw new Error('Failed to load bank options');
        const data = await response.json();
        if (isMounted) {
          setBankOptions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading bank options', error);
        if (isMounted) {
          setBankOptions([]);
        }
      }
    };

    loadBankOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasExistingPaymentDetails = hasPaymentDetails(savedDetails);

  const isChanged = useMemo(() => {
    return (
      form.accountNumber !== savedDetails.accountNumber ||
      form.bankName !== savedDetails.bankName ||
      form.branchName !== savedDetails.branchName ||
      form.accountHolderName !== savedDetails.accountHolderName
    );
  }, [form, savedDetails]);

  const validate = () => {
    const nextErrors = {};

    if (!form.accountNumber) {
      nextErrors.accountNumber = 'Account number is required';
    } else if (!ACCOUNT_NUMBER_REGEX.test(form.accountNumber)) {
      nextErrors.accountNumber = 'Account number must be 12 to 16 digits';
    }

    if (!form.bankName) {
      nextErrors.bankName = 'Bank name is required';
    }

    if (!form.branchName.trim()) {
      nextErrors.branchName = 'Branch name is required';
    }

    if (!form.accountHolderName.trim()) {
      nextErrors.accountHolderName = 'Account holder name is required';
    } else if (!ACCOUNT_HOLDER_REGEX.test(form.accountHolderName.trim())) {
      nextErrors.accountHolderName = 'Account holder name must contain only letters';
    }

    return nextErrors;
  };

  const handleChange = (field, value) => {
    let nextValue = value;

    if (field === 'accountNumber') {
      nextValue = String(value || '').replace(/\D/g, '').slice(0, 16);
    }

    if (field === 'accountHolderName') {
      nextValue = String(value || '').replace(/[^A-Za-z\s]/g, '').slice(0, 80);
    }

    setForm((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        paymentDetails: {
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          branchName: form.branchName.trim(),
          accountHolderName: form.accountHolderName.trim(),
        },
      };

      const response = await updateProfile(payload);
      const updatedUser = response?.data || {};
      const normalizedUpdatedDetails = normalizeDetails(updatedUser.paymentDetails);

      if (updatedUser.token) {
        localStorage.setItem('token', updatedUser.token);
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setForm(normalizedUpdatedDetails);
      setSavedDetails(normalizedUpdatedDetails);

      await Swal.fire({
        title: 'Payment details updated',
        text: 'Your bank account information has been saved successfully.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
      });
    } catch (error) {
      await Swal.fire({
        title: 'Update failed',
        text: error?.response?.data?.message || error?.message || 'Unable to update payment details',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">My Payment Info</h3>
        <p className="text-sm text-gray-600 mb-6">Update your bank details to receive student bank transfers.</p>

        {!hasExistingPaymentDetails && (
          <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your payment details are missing please add them.
          </div>
        )}

        <div className="bg-white shadow-lg shadow-gray-200/60 rounded-2xl overflow-hidden border border-gray-100">
          <form className="px-6 py-7 sm:p-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account number</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatAccountNumber(form.accountNumber)}
                onChange={(event) => handleChange('accountNumber', event.target.value)}
                placeholder="1234 5678 9012"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                  errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.accountNumber && <p className="mt-1 text-xs text-red-600">{errors.accountNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account holder name</label>
              <input
                type="text"
                value={form.accountHolderName}
                onChange={(event) => handleChange('accountHolderName', event.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                  errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.accountHolderName && <p className="mt-1 text-xs text-red-600">{errors.accountHolderName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank name</label>
                <select
                  value={form.bankName}
                  onChange={(event) => handleChange('bankName', event.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" disabled>Select bank</option>
                  {bankOptions.map((bankName) => (
                    <option key={bankName} value={bankName}>{bankName}</option>
                  ))}
                </select>
                {errors.bankName && <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch name</label>
                <input
                  type="text"
                  value={form.branchName}
                  onChange={(event) => handleChange('branchName', event.target.value)}
                  placeholder="Main Branch"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                    errors.branchName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.branchName && <p className="mt-1 text-xs text-red-600">{errors.branchName}</p>}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !isChanged}
                className="px-6 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Payment Info'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerPaymentInfo;
