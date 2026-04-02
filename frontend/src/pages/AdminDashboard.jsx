import React, { useEffect, useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { getBoardings, getAllUsers, assignInspector, createUser, updateUser, deleteUser } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import AdminBoardingManagement from '../components/admin/AdminBoardingManagement';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminProfile from '../components/admin/AdminProfile';
import AdminInquiries from '../components/admin/AdminInquiries';
import AdminReviewModeration from '../components/admin/AdminReviewModeration';
import DashboardShell from '../components/DashboardShell';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeMenu, setActiveMenu] = useState('boarding-management');
  const [boardings, setBoardings] = useState([]);
  const [users, setUsers] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bRes = await getBoardings();
        const uRes = await getAllUsers();
        setBoardings(bRes.data || []);
        setUsers(uRes.data || []);
        setInspectors((uRes.data || []).filter(u => u.role === 'inspector'));
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssign = async (boardingId, inspectorId) => {
    try {
      await assignInspector({ boardingId, inspectorId });
      // Re-fetch boardings to get updated status/assignment
      const bRes = await getBoardings();
      setBoardings(bRes.data || []);
      // Find inspector and boarding names
      const inspector = inspectors.find(i => i._id === inspectorId);
      const boarding = bRes.data?.find(b => b._id === boardingId);
      const inspectorName = inspector ? inspector.name : 'Inspector';
      const boardingName = boarding ? boarding.title : 'Boarding';
      await Swal.fire({
        title: `${inspectorName} assigned to ${boardingName}`,
        icon: 'success',
        draggable: true
      });
    } catch (err) {
      console.error('Assign error', err);
      Swal.fire({
        title: err.response?.data?.message || 'Error assigning inspector',
        icon: 'error',
        draggable: true
      });
    }
  };

  const handleCreateUser = async (data) => {
    try {
      const res = await createUser(data);
      if (res && res.data && res.data._id) {
        const uRes = await getAllUsers();
        setUsers(uRes.data || []);
        return res.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
        return { error: 'email_exists' };
      }
      return { error: msg || 'Error creating user' };
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await updateUser(userId, { role });
      const uRes = await getAllUsers();
      setUsers(uRes.data || []);
    } catch (err) {
      console.error('Update role error', err);
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Delete user error', err);
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  // Prevent scrolling when access denied
  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-10 shadow-xl border border-red-100 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-3">You do not have permission to view the Admin Dashboard.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <span className="text-sm text-red-700 font-medium">Reason:</span> <span className="text-sm text-gray-700">This area is restricted to users with the <span className="font-semibold text-red-600">admin</span> role.</span>
          </div>
          <p className="text-xs text-gray-500">Your role: <span className="font-semibold text-red-600">{user?.role || 'guest'}</span></p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { key: 'profile', label: 'My Profile' },
    { key: 'user-management', label: 'User Management' },
    { key: 'boarding-management', label: 'Boarding Management' },
    { key: 'inquiries', label: 'Inquiries' },
    { key: 'review-moderation', label: 'Review Moderation' },
  ];

  return (
    <DashboardShell user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} menuItems={menuItems} logout={logout}>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {activeMenu === 'boarding-management' && (
            <AdminBoardingManagement boardings={boardings} inspectors={inspectors} onAssign={handleAssign} />
          )}

          {activeMenu === 'user-management' && (
            <AdminUserManagement
              users={users}
              currentUser={user}
              onCreate={handleCreateUser}
              onChangeRole={handleChangeRole}
              onDelete={handleDeleteUser}
            />
          )}

          {activeMenu === 'profile' && (
            <AdminProfile user={user} />
          )}

          {activeMenu === 'inquiries' && (
            <AdminInquiries />
          )}

          {activeMenu === 'review-moderation' && (
            <AdminReviewModeration />
          )}
        </>
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
