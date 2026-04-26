import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile, deleteProfile } from '../../api/api';
import universities from '../../data/universities.json';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).{8,}$/;
const DEFAULT_AVATAR = 'avatar 1.png';

const buildAvatarOptions = (count = 10) =>
  Array.from({ length: count }, (_, index) => `avatar ${index + 1}.png`);

const getAvatarSrc = (avatarName) => `/avatars/${encodeURIComponent(avatarName || DEFAULT_AVATAR)}`;

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-5">
    <h4 className="text-base font-semibold text-gray-900">{title}</h4>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const FieldRow = ({ label, fieldKey, fields, editMode, refs, errors, onChange, toggleEdit, setEditMode, universityOptions, formatUniversityLabel }) => {
  const isEditing = editMode[fieldKey];

  return (
    <div className="group">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {fieldKey === 'university' && isEditing ? (
          <select
            ref={refs[fieldKey]}
            value={fields[fieldKey]}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className="flex-1 rounded-xl border border-indigo-300 bg-white py-2.5 px-3.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          >
            <option value="">Select university</option>
            {universityOptions.map(([code, name]) => (
              <option key={code} value={code}>{code} - {name}</option>
            ))}
          </select>
        ) : (
          <input
            type={fieldKey === 'email' ? 'email' : 'text'}
            ref={refs[fieldKey]}
            readOnly={!isEditing}
            value={fieldKey === 'university' && !isEditing ? formatUniversityLabel(fields[fieldKey]) : fields[fieldKey]}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            inputMode={fieldKey === 'contactNumber' ? 'numeric' : undefined}
            maxLength={fieldKey === 'contactNumber' ? 10 : undefined}
            placeholder={!isEditing && !fields[fieldKey] ? 'Not set' : ''}
            className={`flex-1 rounded-xl py-2.5 px-3.5 text-sm transition-all duration-200 focus:outline-none
              ${errors[fieldKey]
                ? 'border border-red-400 bg-red-50/40 focus:ring-2 focus:ring-red-400/20'
                : isEditing
                ? 'border border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'
                : 'border border-transparent bg-gray-50 text-gray-700 cursor-default'
              }`}
          />
        )}

        <button
          onClick={() => isEditing ? setEditMode((m) => ({ ...m, [fieldKey]: false })) : toggleEdit(fieldKey)}
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
            ${isEditing
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              : 'text-gray-300 hover:text-indigo-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
            }`}
          title={isEditing ? 'Done' : 'Edit'}
        >
          {isEditing ? <CheckIcon /> : <PencilIcon />}
        </button>
      </div>

      {errors[fieldKey] && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {errors[fieldKey]}
        </p>
      )}
    </div>
  );
};

const StudentProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    university: user?.university || '',
    guardianName: user?.guardian?.name || '',
    guardianPhone: user?.guardian?.phone || '',
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
    university: false,
    guardianName: false,
    guardianPhone: false,
  });

  const [changed, setChanged] = useState(false);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [suggestion, setSuggestion] = useState('');

  const universityOptions = Object.entries(universities);
  const formatUniversityLabel = (code) => {
    if (!code) return '';
    const longName = universities[code];
    return longName ? `${code} - ${longName}` : code;
  };

  const refs = {
    name: useRef(null),
    email: useRef(null),
    contactNumber: useRef(null),
    university: useRef(null),
    guardianName: useRef(null),
    guardianPhone: useRef(null),
  };

  const profileInputRef = useRef(null);
  const avatarOptions = buildAvatarOptions();
  const token = localStorage.getItem('token');

  const toggleEdit = (key) => {
    setEditMode((m) => ({ ...m, [key]: true }));
    setTimeout(() => refs[key].current?.focus(), 0);
  };

  const onChange = (key, value) => {
    const nextValue =
      key === 'contactNumber' || key === 'guardianPhone'
        ? value.replace(/\D/g, '').slice(0, 10)
        : value;

    setFields((f) => {
      const next = { ...f, [key]: nextValue };
      setChanged(
        next.name !== (user?.name || '') ||
        next.email !== (user?.email || '') ||
        next.contactNumber !== (user?.contactNumber || '') ||
        next.university !== (user?.university || '') ||
        next.guardianName !== (user?.guardian?.name || '') ||
        next.guardianPhone !== (user?.guardian?.phone || '') ||
        profileImage !== (user?.profileImage || '')
      );
      return next;
    });

    if (['email', 'contactNumber', 'guardianPhone', 'guardianName'].includes(key)) {
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
      alert(err?.response?.data?.message || err.message || 'Error updating avatar');
    }
  };

  const validateProfileFields = () => {
    const nextErrors = {};
    if (!EMAIL_REGEX.test(fields.email.trim())) nextErrors.email = 'Please enter a valid email address';
    if (!fields.contactNumber) nextErrors.contactNumber = 'Mobile number is required';
    else if (!MOBILE_REGEX.test(fields.contactNumber)) nextErrors.contactNumber = 'Mobile number must be exactly 10 digits';
    if (!fields.guardianName.trim()) nextErrors.guardianName = 'Guardian name is required';
    if (!fields.guardianPhone) nextErrors.guardianPhone = 'Guardian phone is required';
    else if (!MOBILE_REGEX.test(fields.guardianPhone)) nextErrors.guardianPhone = 'Guardian phone must be exactly 10 digits';
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
      payload.append('university', fields.university);
      payload.append('guardian', JSON.stringify({ name: fields.guardianName, phone: fields.guardianPhone, type: user?.guardian?.type || 'Other' }));
      if (profileImageFile) payload.append('profileImage', profileImageFile);
      const res = await updateProfile(payload);
      const data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      alert('Profile updated');
      window.location.reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Supported formats: JPG, JPEG, PNG, WEBP');
    }
  };

  const [pw, setPw] = useState({ current: '', newPass: '', confirm: '' });
  const changePassword = async () => {
    if (!pw.current || !pw.newPass || !pw.confirm) return alert('Fill all password fields');
    if (!STRONG_PASSWORD_REGEX.test(pw.newPass)) return alert('Password must be at least 8 characters and include uppercase, lowercase, and a special character (@ # $ % & *)');
    if (pw.newPass !== pw.confirm) return alert('New passwords do not match');
    try {
      const res = await updateProfile({ password: pw.newPass, currentPassword: pw.current });
      const data = res.data;
      localStorage.setItem('token', data.token || token);
      localStorage.setItem('user', JSON.stringify(data));
      alert('Password changed');
      setPw({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Error changing password');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const res = await deleteProfile();
      if (res.status !== 200) throw new Error('Failed to delete account');
      alert('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Error deleting account');
    }
  };

  function calculateProfileCompletion(u = {}) {
    const weights = {
      name: 10,
      email: 10,
      phone: 10,
      university: 10,
      guardianName: 10,
      guardianPhone: 10,
      profileImage: 20,
      dob: 10,
      password: 10,
    };

    let total = 0;
    if (u.name) total += weights.name;
    if (u.email) total += weights.email;
    if (u.contactNumber) total += weights.phone;
    if (u.university) total += weights.university;
    if (u.guardian?.name) total += weights.guardianName;
    if (u.guardian?.phone) total += weights.guardianPhone;
    if (u.profileImage) total += weights.profileImage;
    if (u.dob) total += weights.dob;
    total += weights.password;

    return Math.min(100, Math.round(total));
  }

  useEffect(() => {
    const mergedUser = {
      ...user,
      name: fields.name,
      email: fields.email,
      contactNumber: fields.contactNumber,
      university: fields.university,
      guardian: { name: fields.guardianName, phone: fields.guardianPhone, ...(user?.guardian || {}) },
      profileImage: profileImage || user?.profileImage,
    };

    const p = calculateProfileCompletion(mergedUser);
    setProgress(p);

    if (!mergedUser.profileImage) setSuggestion('Add a profile photo to complete your profile');
    else if (!mergedUser.guardian?.name || !mergedUser.guardian?.phone) setSuggestion('Complete your guardian details');
    else if (!mergedUser.contactNumber) setSuggestion('Add your contact number');
    else setSuggestion('Your profile looks great!');
  }, [user, fields, profileImage]);

  const progressColor = progress <= 40 ? '#ef4444' : progress <= 70 ? '#f59e0b' : '#10b981';
  const progressBg = progress <= 40 ? 'bg-red-500' : progress <= 70 ? 'bg-amber-400' : 'bg-emerald-500';

  const fieldConfig = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'contactNumber', label: 'Phone Number' },
    { key: 'university', label: 'University' },
  ];

  const guardianConfig = [
    { key: 'guardianName', label: 'Guardian Name' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information and account preferences</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="h-40 w-40 rounded-2xl border-4 border-white shadow-md bg-gray-100 overflow-hidden">
                  <img src={profileImage || getAvatarSrc(avatar)} alt="Profile" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(avatar || DEFAULT_AVATAR);
                    setAvatarModalOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"
                  title="Change avatar"
                >
                  <PencilIcon />
                </button>
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
              </div>

              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
              >
                <CameraIcon />
                Upload photo
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{fields.name || 'Your Name'}</h2>
              <p className="text-sm text-gray-500">{formatUniversityLabel(fields.university) || 'No university set'}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Profile completion</span>
                <span className="text-xs font-semibold" style={{ color: progressColor }}>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`${progressBg} h-full rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
              </div>
              {progress < 100 && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {suggestion}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <SectionHeader title="Personal Information" subtitle="Update your basic profile details" />
            <div className="space-y-5">
              {fieldConfig.map(({ key, label }) => (
                <FieldRow
                  key={key}
                  label={label}
                  fieldKey={key}
                  fields={fields}
                  editMode={editMode}
                  refs={refs}
                  errors={errors}
                  onChange={onChange}
                  toggleEdit={toggleEdit}
                  setEditMode={setEditMode}
                  universityOptions={universityOptions}
                  formatUniversityLabel={formatUniversityLabel}
                />
              ))}
            </div>
          </div>

          <div className="mx-6 my-5 border-t border-gray-50" />

          <div className="px-6 pb-6">
            <SectionHeader title="Guardian Details" subtitle="Emergency contact information" />
            <div className="space-y-5">
              {guardianConfig.map(({ key, label }) => (
                <FieldRow
                  key={key}
                  label={label}
                  fieldKey={key}
                  fields={fields}
                  editMode={editMode}
                  refs={refs}
                  errors={errors}
                  onChange={onChange}
                  toggleEdit={toggleEdit}
                  setEditMode={setEditMode}
                  universityOptions={universityOptions}
                  formatUniversityLabel={formatUniversityLabel}
                />
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl flex justify-end">
            <button
              disabled={!changed}
              onClick={saveChanges}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${changed
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Save changes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 pt-6 pb-2">
            <SectionHeader title="Change Password" subtitle="Use a strong password with uppercase, lowercase and special characters" />
            <div className="space-y-3">
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
                  onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all"
                />
              ))}
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl flex justify-end mt-4">
            <button
              onClick={changePassword}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
            >
              Update password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm">
          <div className="px-6 py-6 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Delete Account</h4>
              <p className="text-xs text-gray-400 mt-0.5">Permanently remove your account and all data. This cannot be undone.</p>
            </div>
            <button
              onClick={deleteAccount}
              className="flex-shrink-0 ml-4 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h4 className="text-base font-semibold text-gray-900">Choose an avatar</h4>
                <p className="text-xs text-gray-400 mt-0.5">Select one of the default avatars</p>
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            <div className="p-6 grid grid-cols-5 gap-3">
              {avatarOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedAvatar(option)}
                  className={`relative rounded-2xl p-0.5 transition-all duration-150
                    ${selectedAvatar === option
                      ? 'ring-2 ring-indigo-500 ring-offset-1'
                      : 'ring-1 ring-transparent hover:ring-gray-200'
                    }`}
                >
                  <img src={getAvatarSrc(option)} alt={option} className="h-14 w-14 rounded-xl object-cover" />
                  {selectedAvatar === option && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/70 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvatarSelection}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Save avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
