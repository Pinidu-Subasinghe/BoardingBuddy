import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerBookings, extendStay, endStay } from '../../api/api';
import { formatDate } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const OwnerOngoingStays = () => {
  const { user } = useContext(AuthContext);
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
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
    return <LoadingAnimation text="Loading ongoing stays..." containerClassName="min-h-screen" />;
  }

  return (
    <div className="bg-gray-50/70 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Ongoing Stays</h3>
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">{ongoing.length} Active</span>
          </div>
        </div>

        {error && <div role="alert" className="mb-4 text-red-600 font-medium">{error}</div>}

        {ongoing.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <div className="text-xl font-semibold text-gray-700 mb-3">No ongoing stays found.</div>
            <p className="text-gray-600">When students are currently staying at your boardings, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] divide-y divide-gray-200">
                <caption className="sr-only">Active student stays with actions</caption>
                <thead className="bg-gray-50 hidden md:table-header-group">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Boarding</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Stay Period</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {ongoing.map((stay) => (
                    <tr key={stay._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-3">
                        <div className="text-sm font-medium text-gray-900">{stay.student?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mt-1 md:hidden">{stay.student?.contactNumber || stay.contactNumber || 'N/A'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 hidden md:table-cell text-sm text-gray-700">{stay.student?.contactNumber || stay.contactNumber || 'N/A'}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">{stay.boarding?.title || 'N/A'}</td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                        <span className="block md:inline">{stay.stayStart ? formatDate(stay.stayStart) : 'N/A'}</span>
                        <span className="hidden md:inline mx-2 text-gray-400">to</span>
                        <span className="block md:inline font-semibold">{stay.stayEnd ? formatDate(stay.stayEnd) : 'N/A'}</span>
                        <div className="text-xs text-gray-500 mt-1 md:hidden">{stay.boarding?.title || 'N/A'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm flex gap-2 justify-end">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                          disabled={actionLoading === stay._id}
                          onClick={() => setExtendModal({ open: true, booking: stay, newEndDate: '' })}
                          aria-label={`Extend stay for ${stay.student?.name || 'student'}`}
                          aria-busy={actionLoading === stay._id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Extend
                        </button>

                        <button
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
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
                          aria-label={`Close stay for ${stay.student?.name || 'student'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Close Stay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {extendModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-labelledby="extend-modal-title">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-start justify-between">
                <h4 id="extend-modal-title" className="text-lg font-bold">Extend Stay</h4>
                <button
                  onClick={() => setExtendModal({ open: false, booking: null, newEndDate: '' })}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  aria-label="Close extend modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                Current End Date: <span className="font-semibold">{extendModal.booking?.stayEnd ? formatDate(extendModal.booking.stayEnd) : 'N/A'}</span>
              </div>

              <label className="block text-sm font-medium mt-4">New End Date</label>
              <input
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={extendModal.booking?.stayEnd ? new Date(new Date(extendModal.booking.stayEnd).getTime() + 86400000).toISOString().split('T')[0] : ''}
                value={extendModal.newEndDate}
                onChange={e => setExtendModal(modal => ({ ...modal, newEndDate: e.target.value }))}
              />

              <div className="flex gap-2 justify-end mt-5">
                <button
                  className="px-4 py-1 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                  onClick={() => setExtendModal({ open: false, booking: null, newEndDate: '' })}
                  disabled={actionLoading === extendModal.booking?._id}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
                  disabled={!extendModal.newEndDate || actionLoading === extendModal.booking?._id}
                  onClick={async () => {
                    setActionLoading(extendModal.booking?._id);
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
                >
                  Extend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerOngoingStays;
