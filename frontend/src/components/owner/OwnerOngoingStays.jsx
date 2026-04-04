import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerBookings, extendStay, endStay } from '../../api/api';
import { formatDate } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';
import Swal from 'sweetalert2';

const OwnerOngoingStays = () => {
  const { user } = useContext(AuthContext);
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // bookingId or null
  const [extendModal, setExtendModal] = useState({ open: false, booking: null, newEndDate: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOngoing = async () => {
    setLoading(true);
    try {
      const res = await getOwnerBookings();
      setOngoing((res.data || []).filter(b => b.status === 'student_stayed'));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load ongoing stays' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoing();
  }, [user]);

  const filteredStays = useMemo(() => {
    if (!searchQuery) return ongoing;
    const query = searchQuery.toLowerCase();
    return ongoing.filter(stay => 
      (stay.student?.name || '').toLowerCase().includes(query) ||
      (stay.boarding?.title || '').toLowerCase().includes(query) ||
      (stay.student?.contactNumber || '').includes(query)
    );
  }, [ongoing, searchQuery]);

  const stats = useMemo(() => ({
    total: ongoing.length,
    endingThisMonth: ongoing.filter(s => {
      const end = new Date(s.stayEnd);
      const now = new Date();
      return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
    }).length,
    endingSoon: ongoing.filter(s => {
      const end = new Date(s.stayEnd);
      const daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    }).length
  }), [ongoing]);

  const getStayProgress = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const total = endDate - startDate;
    const elapsed = now - startDate;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return { progress, daysLeft };
  };

  const handleCloseStay = async (stay) => {
    const result = await Swal.fire({
      title: 'Close Stay?',
      text: `Are you sure you want to end ${stay.student?.name}'s stay at ${stay.boarding?.title}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Close Stay',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    
    if (!result.isConfirmed) return;
    
    setActionLoading(stay._id);
    try {
      await endStay(stay._id);
      await Swal.fire({ icon: 'success', title: 'Stay Closed', timer: 1500, showConfirmButton: false });
      await fetchOngoing();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to close stay' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async () => {
    if (!extendModal.newEndDate) return;
    
    setActionLoading(extendModal.booking._id);
    try {
      await extendStay(extendModal.booking._id, extendModal.newEndDate);
      setExtendModal({ open: false, booking: null, newEndDate: '' });
      await Swal.fire({ icon: 'success', title: 'Stay Extended', timer: 1500, showConfirmButton: false });
      await fetchOngoing();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to extend stay' });
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    return colors[name?.length % colors.length] || 'bg-gray-500';
  };

  if (loading) {
    return <LoadingAnimation text="Loading ongoing stays..." containerClassName="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ongoing Stays</h1>
          <p className="text-slate-500 mt-1">Manage current student accommodations</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by student name, boarding or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Stays Grid */}
        {filteredStays.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No ongoing stays</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              When students confirm their stay at your boardings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStays.map((stay) => {
              const { progress, daysLeft } = getStayProgress(stay.stayStart, stay.stayEnd);
              const isEndingSoon = daysLeft <= 7;
              
              return (
                <div key={stay._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${getAvatarColor(stay.student?.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                        {getInitials(stay.student?.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{stay.student?.name || 'Unknown Student'}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {stay.student?.contactNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isEndingSoon ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isEndingSoon ? `${daysLeft} days left` : 'Active'}
                    </span>
                  </div>

                  {/* Boarding Info */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium text-slate-900">{stay.boarding?.title || 'Unknown Boarding'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {formatDate(stay.stayStart)} → {formatDate(stay.stayEnd)}
                      </span>
                      <span className="font-medium text-slate-700">
                        LKR {stay.boarding?.monthlyRent?.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500">Stay Progress</span>
                      <span className="font-medium text-slate-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isEndingSoon ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setExtendModal({ open: true, booking: stay, newEndDate: '' })}
                      disabled={actionLoading === stay._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Extend Stay
                    </button>
                    <button
                      onClick={() => handleCloseStay(stay)}
                      disabled={actionLoading === stay._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close Stay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Extend Modal */}
      {extendModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !actionLoading && setExtendModal({ open: false, booking: null, newEndDate: '' })} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Extend Stay</h3>
                <p className="text-sm text-slate-500">{extendModal.booking?.student?.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Current End Date</span>
                <span className="font-medium text-slate-900">{formatDate(extendModal.booking?.stayEnd)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Boarding</span>
                <span className="font-medium text-slate-900">{extendModal.booking?.boarding?.title}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">New End Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={extendModal.booking?.stayEnd ? new Date(new Date(extendModal.booking.stayEnd).getTime() + 86400000).toISOString().split('T')[0] : ''}
                value={extendModal.newEndDate}
                onChange={e => setExtendModal(m => ({ ...m, newEndDate: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setExtendModal({ open: false, booking: null, newEndDate: '' })}
                disabled={actionLoading === extendModal.booking?._id}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={!extendModal.newEndDate || actionLoading === extendModal.booking?._id}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === extendModal.booking?._id ? 'Extending...' : 'Extend Stay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerOngoingStays;
