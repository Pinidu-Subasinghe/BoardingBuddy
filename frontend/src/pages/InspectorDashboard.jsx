import React, { useContext, useEffect, useState } from 'react';
import { getBoardings } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import InspectorInquiries from '../components/inspector/InspectorInquiries';
import InspectorReviewedTasks from '../components/inspector/InspectorReviewedTasks';
import InspectorProfile from '../components/inspector/InspectorProfile';

const InspectorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('assigned-tasks');

  useEffect(() => {
    const fetchBoardings = async () => {
      try {
        const res = await getBoardings();
        setBoardings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoardings();
  }, []);

  React.useEffect(() => {
    if (!user || user.role !== 'inspector') {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    }

    document.body.classList.remove('overflow-hidden');
    return undefined;
  }, [user]);

  if (!user || user.role !== 'inspector') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-10 shadow-xl border border-red-100 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-3">You do not have permission to view the Inspector Dashboard.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <span className="text-sm text-red-700 font-medium">Reason:</span> <span className="text-sm text-gray-700">This area is restricted to users with the <span className="font-semibold text-red-600">inspector</span> role.</span>
          </div>
          <p className="text-xs text-gray-500">Your role: <span className="font-semibold text-red-600">{user?.role || 'guest'}</span></p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { key: 'profile', label: 'My Profile' },
    { key: 'inquiries', label: 'My Inquiries' },
  ];

  return (
    <DashboardShell
      user={user}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      menuItems={menuItems}
      logout={logout}
    >
      <div className="px-4 py-6 md:px-8">
        {activeMenu === 'inquiries' ? (
          <InspectorInquiries />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
              Assigned Boardings
            </h2>

          {activeMenu === 'reviewed-tasks' && (
            <InspectorReviewedTasks boardings={boardings} user={user} />
          )}

          {activeMenu === 'profile' && (
            <InspectorProfile />
          )}
        </>
      )}
      </div>
    </DashboardShell>
  );
};

export default InspectorDashboard;