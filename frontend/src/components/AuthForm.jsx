import React, { useState, useContext } from 'react';
import universities from '../data/universities.json';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AuthForm = () => {
  const { login, register, closeAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'male',
    contactNumber: '',
    role: 'student',
    university: ''
  });

  const [emailError, setEmailError] = useState('');

  const universityOptions = Object.entries(universities);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    try {
      let userData;

      if (isLogin) {
        userData = await login({ email: formData.email, password: formData.password });
        Swal.fire({ title: 'Signed in!', icon: 'success', draggable: true });
        closeAuth();
      } else {
        userData = await register(formData);
        Swal.fire({ title: 'Account created', icon: 'success', draggable: true });
        closeAuth();
      }

      const role = userData.role;

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
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error occurred';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        setEmailError('Email is already registered');
      } else {
        Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      }
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
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />

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

                <input
                  type="text"
                  name="contactNumber"
                  placeholder="Phone"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
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
              )}
            </>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => { handleChange(e); setEmailError(''); }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />

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
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default AuthForm;