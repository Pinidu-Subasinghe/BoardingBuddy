import React, { useContext, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile } from '../../api/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

const AdminProfile = () => {
  const { user: contextUser } = useContext(AuthContext);
  const user = getCurrentUser() || contextUser;

  const [fields, setFields] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
  });

  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    contactNumber: false,
  });

  const [changed, setChanged] = useState(false);
  const [errors, setErrors] = useState({});
  const refs = {
    name: useRef(null),
    email: useRef(null),
    contactNumber: useRef(null),
  };
  const token = localStorage.getItem('token');

  const toggleEdit = (key) => {
    setEditMode((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => refs[key].current?.focus(), 0);
  };

  const onChange = (key, value) => {
    const nextValue = key === 'contactNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setFields((prev) => {
      const next = { ...prev, [key]: nextValue };
      setChanged(
        next.name !== (user?.name || '') ||
        next.email !== (user?.email || '') ||
        next.contactNumber !== (user?.contactNumber || '')
      );
      return next;
    });

    if (key === 'email' || key === 'contactNumber') {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateProfileFields = () => {
    const nextErrors = {};

    if (!EMAIL_REGEX.test(fields.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!fields.contactNumber) {
      nextErrors.contactNumber = 'Mobile number is required';
    } else if (!MOBILE_REGEX.test(fields.contactNumber)) {
      nextErrors.contactNumber = 'Mobile number must be exactly 10 digits';
    }

    return nextErrors;
  };

  const saveChanges = async () => {
    const validationErrors = validateProfileFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await updateProfile(fields);
      const data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      alert('Profile updated');
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error updating profile';
      alert(msg);
    }
  };

  const [pw, setPw] = useState({ current: '', newPass: '', confirm: '' });

  const changePassword = async () => {
    if (!pw.current || !pw.newPass || !pw.confirm) return alert('Fill all password fields');
    if (!STRONG_PASSWORD_REGEX.test(pw.newPass)) {
      return alert('Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)');
    }
    if (pw.newPass !== pw.confirm) return alert('New passwords do not match');
    try {
      const res = await updateProfile({ password: pw.newPass, currentPassword: pw.current });
      const data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      alert('Password changed');
      setPw({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error changing password';
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">My Profile</h3>

        <div className="bg-white shadow-lg shadow-gray-200/60 rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-7 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {['name', 'email', 'contactNumber'].map((key) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-gray-700 capitalize tracking-wide">
                    {key === 'contactNumber' ? 'Phone Number' : key}
                  </span>
                  <div className="mt-1.5 relative flex items-center gap-2 group">
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      ref={refs[key]}
                      readOnly={!editMode[key]}
                      value={fields[key]}
                      onChange={(e) => onChange(key, e.target.value)}
                      inputMode={key === 'contactNumber' ? 'numeric' : undefined}
                      maxLength={key === 'contactNumber' ? 10 : undefined}
                      className={`
                        block w-full rounded-lg border-gray-300
                        shadow-sm
                        focus:border-indigo-500 focus:ring-indigo-500
                        focus:ring-1 focus:ring-opacity-50
                        transition-all duration-200
                        ${errors[key]
                          ? 'border-red-500 ring-1 ring-red-100'
                          : editMode[key]
                          ? 'bg-white border-indigo-400 ring-1 ring-indigo-200'
                          : 'bg-gray-50/70 border-gray-200 text-gray-800 cursor-default'}
                        py-2.5 px-4 text-base
                      `}
                    />
                    {!editMode[key] ? (
                      <button
                        onClick={() => toggleEdit(key)}
                        className="p-2 text-gray-500 hover:text-indigo-600
                                 opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditMode((prev) => ({ ...prev, [key]: false }))}
                        className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                        title="Done"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {errors[key] && (
                    <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                  )}
                </label>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                disabled={!changed}
                onClick={saveChanges}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-white
                  shadow-md transition-all duration-200
                  ${changed
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300/40 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                    : 'bg-gray-300 cursor-not-allowed'}
                `}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow-lg shadow-gray-200/60 rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-7 sm:p-8">
            <h4 className="text-xl font-semibold text-gray-900 mb-5">Change Password</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { placeholder: 'Current password', key: 'current' },
                { placeholder: 'New password', key: 'newPass' },
                { placeholder: 'Confirm new password', key: 'confirm' },
              ].map(({ placeholder, key }) => (
                <input
                  key={key}
                  type="password"
                  placeholder={placeholder}
                  value={pw[key]}
                  onChange={(e) => setPw((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="
                    block w-full rounded-lg border-gray-300
                    shadow-sm py-2.5 px-4 text-base
                    focus:border-indigo-500 focus:ring-indigo-500
                    focus:ring-1 focus:ring-opacity-50 transition-all duration-200
                    placeholder:text-gray-400
                  "
                />
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={changePassword}
                className="
                  px-6 py-2.5 rounded-lg font-medium text-white
                  bg-indigo-600 hover:bg-indigo-700
                  shadow-md hover:shadow-indigo-300/40
                  focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  transition-all duration-200
                "
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
