import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser } from '../api/api';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
        return JSON.parse(userData);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // Auto logout timer
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const openAuth = () => setShowAuthModal(true);
  const closeAuth = () => setShowAuthModal(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const expiry = decoded.exp * 1000;
      const timeout = expiry - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          logout();
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [user, logout]);

  const login = async (data) => {
    const res = await loginUser(data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  // logout is now memoized above

  return (
    <AuthContext.Provider value={{ user, login, register, logout, showAuthModal, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  );
};