import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StudentProfile from '../components/student/StudentProfile';
import StudentBoardings from '../components/student/StudentBoardings';
import StudentPayments from '../components/student/StudentPayments';
import StudentReviews from '../components/student/StudentReviews';
import StudentInquiries from '../components/student/StudentInquiries';
import StudentWishlist from '../components/student/StudentWishlist';
import DashboardShell from '../components/DashboardShell';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(location.state?.activeMenu || 'profile');

  React.useEffect(() => {
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }
  }, [location.state]);

  // Prevent scrolling when access denied
  React.useEffect(() => {
    if (!user || user.role !== 'student') {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [user]);

  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-10 shadow-xl border border-red-100 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-3">You do not have permission to view the Student Dashboard.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <span className="text-sm text-red-700 font-medium">Reason:</span> <span className="text-sm text-gray-700">This area is restricted to users with the <span className="font-semibold text-red-600">student</span> role.</span>
          </div>
          <p className="text-xs text-gray-500">Your role: <span className="font-semibold text-red-600">{user?.role || 'guest'}</span></p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile':
        return <StudentProfile />;
      case 'my-boardings':
        return <StudentBoardings />;
      case 'wishlist':
        return <StudentWishlist />;
      case 'my-payments':
        return <StudentPayments />;
      case 'my-reviews':
        return <StudentReviews />;
      case 'inquiries':
        return <StudentInquiries />;
      default:
        return <StudentProfile />;
    }
  };

  const menuItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'my-boardings', label: 'My Boardings' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'my-payments', label: 'My Payments' },
    { key: 'my-reviews', label: 'My Reviews' },
    { key: 'inquiries', label: 'My Inquiries' },
  ];

  return (
    <DashboardShell user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuItems={menuItems} logout={logout}>
      {renderContent()}
    </DashboardShell>
  );
};

export default StudentDashboard;
