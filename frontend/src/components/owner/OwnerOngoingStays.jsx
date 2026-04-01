import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerBookings, extendStay, endStay } from '../../api/api';
import { formatDate } from '../../utils/date';

const OwnerOngoingStays = () => {
  const { user } = useContext(AuthContext);
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // bookingId or null
  const [extendModal, setExtendModal] = useState({ open: false, booking: null, newEndDate: '' });
  const [error, setError] = useState('');

  const fetchOngoing = async () => {
    setLoading(true);
    try {
      const res = await getOwnerBookings();
      setOngoing((res.data || []).filter(b => b.status === 'student_stayed'));
    } catch (err) {
      setError('Error fetching ongoing stays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoing();
    // eslint-disable-next-line
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-lg font-medium text-indigo-600">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading ongoing stays...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/70 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-6 md:mb-8">
          Ongoing Stays
        </h3>
        {error && (
          <div className="mb-4 text-red-600 font-medium">{error}</div>
        )}
        {ongoing.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
            <div className="text-xl font-semibold text-gray-700 mb-3">
              No ongoing stays found.
            </div>
            <p className="text-gray-600">
              When students are currently staying at your boardings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[800px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Boarding</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Stay Period</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {ongoing.map((stay) => (
                  <tr key={stay._id} className="hover:bg-gray-50/70 transition-colors duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stay.student?.name || 'N/A'}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{stay.student?.contactNumber || stay.contactNumber || 'N/A'}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">{stay.boarding?.title || 'N/A'}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                      {stay.stayStart ? formatDate(stay.stayStart) : 'N/A'}
                      {' '}to{' '}
                      {stay.stayEnd ? formatDate(stay.stayEnd) : 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm flex gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                        disabled={actionLoading === stay._id}
                        onClick={() => setExtendModal({ open: true, booking: stay, newEndDate: '' })}
                      >
                        Extend
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                        disabled={actionLoading === stay._id}
                        onClick={async () => {
                          if (!window.confirm('Are you sure you want to close this stay?')) return;
                          setActionLoading(stay._id);
                          setError('');
                          try {
                            await endStay(stay._id);
                            await fetchOngoing();
                          } catch (err) {
                            setError(err.message || 'Failed to close stay');
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                      >
                        Close Stay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Extend Modal */}
        {extendModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-bold mb-2">Extend Stay</h4>
              <div className="mb-3 text-sm text-gray-700">
                Current End Date:{' '}
                <span className="font-semibold">{extendModal.booking.stayEnd ? formatDate(extendModal.booking.stayEnd) : 'N/A'}</span>
              </div>
              <label className="block mb-2 text-sm font-medium">New End Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 w-full mb-4"
                min={extendModal.booking.stayEnd ? new Date(new Date(extendModal.booking.stayEnd).getTime() + 86400000).toISOString().split('T')[0] : ''}
                value={extendModal.newEndDate}
                onChange={e => setExtendModal(modal => ({ ...modal, newEndDate: e.target.value }))}
              />
              <div className="flex gap-2 justify-end">
                <button
                  className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={() => setExtendModal({ open: false, booking: null, newEndDate: '' })}
                  disabled={actionLoading === extendModal.booking._id}
                >Cancel</button>
                <button
                  className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                  disabled={!extendModal.newEndDate || actionLoading === extendModal.booking._id}
                  onClick={async () => {
                    setActionLoading(extendModal.booking._id);
                    setError('');
                    try {
                      await extendStay(extendModal.booking._id, extendModal.newEndDate);
                      setExtendModal({ open: false, booking: null, newEndDate: '' });
                      await fetchOngoing();
                    } catch (err) {
                      setError(err.message || 'Failed to extend stay');
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                >Extend</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerOngoingStays;
