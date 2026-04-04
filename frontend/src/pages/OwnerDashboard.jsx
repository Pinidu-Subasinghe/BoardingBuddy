import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import OwnerProfile from '../components/owner/OwnerProfile';
import OwnerBoardings from '../components/owner/OwnerBoardings';
import OwnerPayments from '../components/owner/OwnerPayments';
import OwnerVisits from '../components/owner/OwnerVisits';
import OwnerAnalytics from '../components/owner/OwnerAnalytics';
import OwnerOngoingStays from '../components/owner/OwnerOngoingStays';
import OwnerInquiries from '../components/owner/OwnerInquiries';
import OwnerReminders from '../components/owner/OwnerReminders';
import DashboardShell from '../components/DashboardShell';

const OwnerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(() => {
    // Read from navigation state if available
    return location.state?.activeMenu || 'profile';
  });

  // Update activeMenu when location state changes
  useEffect(() => {
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }
  }, [location.state]);

  // Prevent scrolling when access denied
  React.useEffect(() => {
    if (!user || user.role !== 'owner') {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [user]);

  if (!user || user.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-10 shadow-xl border border-red-100 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-3">You do not have permission to view the Owner Dashboard.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <span className="text-sm text-red-700 font-medium">Reason:</span> <span className="text-sm text-gray-700">This area is restricted to users with the <span className="font-semibold text-red-600">owner</span> role.</span>
          </div>
          <p className="text-xs text-gray-500">Your role: <span className="font-semibold text-red-600">{user?.role || 'guest'}</span></p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'reminders':
        return <OwnerReminders />;
      case 'profile':
        return <OwnerProfile />;
      case 'boardings':
        return <OwnerBoardings />;
      case 'receivedPayments':
        return <OwnerPayments />;
      case 'visits':
        return <OwnerVisits />;
      case 'ongoing':
        return <OwnerOngoingStays />;
      case 'analytics':
        return <OwnerAnalytics />;
      case 'inquiries':
        return <OwnerInquiries />;
      default:
        return <OwnerProfile />;
    }
  };

  const menuItems = [
    { key: 'profile', label: 'My Profile' },
    { key: 'boardings', label: 'My Boardings' },
    { key: 'visits', label: 'My Visits' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'ongoing', label: 'Ongoing stays' },
    { key: 'receivedPayments', label: 'Received Payments' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'inquiries', label: 'Inquiries' },
  ];

  return (
    <DashboardShell user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuItems={menuItems} logout={logout}>
      {renderContent()}
    </DashboardShell>
  );
};

export default OwnerDashboard;