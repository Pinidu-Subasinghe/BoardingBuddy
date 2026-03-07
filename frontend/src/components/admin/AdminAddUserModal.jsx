import React, { useState } from 'react';
import Swal from 'sweetalert2';
import universities from '../../data/universities.json';

const AdminAddUserModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'male',
    contactNumber: '',
    role: 'student',
    university: ''
  });
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const universityOptions = Object.entries(universities);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    if (!form.name || !form.email || !form.password || !form.contactNumber || !form.gender) {
      setError('Required fields missing');
      return;
    }

    try {
      setLoading(true);

      // Call onSubmit and wait for it
      const res = await onSubmit({
        ...form,
        university: form.role === 'student' ? form.university : undefined
      });

      // If error object returned, show friendly error
      if (res && res.error) {
        if (res.error === 'email_exists') {
          setEmailError('Email is already registered');
        } else {
          setError('Error creating user');
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
        gender: 'male',
        contactNumber: '',
        role: 'student',
        university: ''
      });

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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">

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
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

          <div>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
            {emailError && <span className="text-red-600 text-xs mt-1 block">{emailError}</span>}
          </div>

          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            type="password"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

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

          <input
            name="contactNumber"
            value={form.contactNumber}
            onChange={handleChange}
            placeholder="Contact Number"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

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
            <select
              name="university"
              value={form.university}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">Select university (optional)</option>
              {universityOptions.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
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