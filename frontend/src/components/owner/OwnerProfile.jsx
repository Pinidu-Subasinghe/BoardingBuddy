import React, { useContext, useState, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateProfile } from '../../api/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const DEFAULT_AVATAR = 'avatar 1.png';

const buildAvatarOptions = (count = 10) =>
  Array.from({ length: count }, (_, index) => `avatar ${index + 1}.png`);

const getAvatarSrc = (avatarName) => `/avatars/${encodeURIComponent(avatarName || DEFAULT_AVATAR)}`;

// Always get latest user from localStorage after update
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

const OwnerProfile = () => {
  const { user: contextUser } = useContext(AuthContext);
  const user = getCurrentUser() || contextUser;

  const [fields, setFields] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
  });

  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [avatar, setAvatar] = useState(user?.avatar || DEFAULT_AVATAR);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || DEFAULT_AVATAR);

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
  const profileInputRef = useRef(null);
  const avatarOptions = buildAvatarOptions();
  const token = localStorage.getItem('token');

  const toggleEdit = (key) => {
    setEditMode(m => ({ ...m, [key]: true }));
    setTimeout(() => refs[key].current?.focus(), 0);
  };

  const onChange = (key, value) => {
    const nextValue = key === 'contactNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;

    setFields(f => {
      const next = { ...f, [key]: nextValue };
      setChanged(
        next.name !== (user?.name || '') ||
        next.email !== (user?.email || '') ||
        next.contactNumber !== (user?.contactNumber || '') ||
        profileImage !== (user?.profileImage || '')
      );
      return next;
    });

    if (key === 'email' || key === 'contactNumber') {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert('Image format is invalid. Use JPG, JPEG, PNG, or WEBP.');
      e.target.value = '';
      return;
    }

    setProfileImageFile(file);
    setProfileImage(URL.createObjectURL(file));
    setChanged(true);
  };

  const saveAvatarSelection = async () => {
    if (!selectedAvatar) return;
    try {
      const payload = new FormData();
      payload.append('avatar', selectedAvatar);
      const res = await updateProfile(payload);
      const data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      setAvatar(selectedAvatar);
      setAvatarModalOpen(false);
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error updating avatar';
      alert(msg);
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
      const payload = new FormData();
      payload.append('name', fields.name);
      payload.append('email', fields.email);
      payload.append('contactNumber', fields.contactNumber);
      if (profileImageFile) {
        payload.append('profileImage', profileImageFile);
      }

      const res = await updateProfile(payload);
      let data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      alert('Profile updated');
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message
        || 'Supported formats: JPG, JPEG, PNG, WEBP';
      alert(msg);
    }
  };

  // Password change
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

        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="rounded-full bg-gradient-to-br from-black via-gray-900 to-blue-600 p-1">
              <div className="h-32 w-32 rounded-full border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
              <img
                src={profileImage || getAvatarSrc(avatar)}
                alt="Profile"
                className="h-full w-full object-cover"
              />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAvatar(avatar || DEFAULT_AVATAR);
                setAvatarModalOpen(true);
              }}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:text-indigo-600"
              aria-label="Edit profile image"
              title="Edit profile image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9z" />
              </svg>
            </button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
          </div>
          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Upload profile image
          </button>
        </div>

        {avatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Choose an avatar</h4>
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
                {avatarOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedAvatar(option)}
                    className={`rounded-full p-1 ring-2 transition ${
                      selectedAvatar === option ? 'ring-indigo-500' : 'ring-transparent'
                    }`}
                  >
                    <img
                      src={getAvatarSrc(option)}
                      alt={option}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAvatarSelection}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save avatar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Info Card */}
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
                        onClick={() => setEditMode(m => ({ ...m, [key]: false }))}
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

        {/* Change Password Card */}
        <div className="mt-8 bg-white shadow-lg shadow-gray-200/60 rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-7 sm:p-8">
            <h4 className="text-xl font-semibold text-gray-900 mb-5">Change Password</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { placeholder: "Current password", key: "current" },
                { placeholder: "New password", key: "newPass" },
                { placeholder: "Confirm new password", key: "confirm" },
              ].map(({ placeholder, key }) => (
                <input
                  key={key}
                  type="password"
                  placeholder={placeholder}
                  value={pw[key]}
                  onChange={(e) => setPw(p => ({ ...p, [key]: e.target.value }))}
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

export default OwnerProfile;
