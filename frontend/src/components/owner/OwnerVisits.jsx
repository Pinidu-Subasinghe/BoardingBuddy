import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerBookings, markVisitComplete, confirmStay, closeBooking } from '../../api/api';
import Swal from 'sweetalert2';
import { formatDateTime } from '../../utils/date';

const OwnerVisits = () => {
  const { user } = useContext(AuthContext);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await getOwnerBookings();
        setVisits(res.data || []);
      } catch (err) {
        console.error('Error fetching visits:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-lg font-medium text-indigo-600">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading visits...
        </div>
      </div>
    );
  }

  // Filter and sort visits
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'requested', label: 'Requested' },
    { value: 'visit_completed', label: 'Visit Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 'left', label: 'Left' },
  ];

  // Hide 'left' by default, only show if filtered
  const filteredVisits = visits
    .filter(v => v.status !== 'student_stayed')
    .filter(v => {
      if (statusFilter === 'all') return v.status !== 'left';
      if (statusFilter === 'left') return v.status === 'left';
      return v.status === statusFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.requestedAt || a.createdAt || 0);
      const dateB = new Date(b.requestedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  return (
    <div className="min-h-screen bg-gray-50/70 py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Student Visits
          </h3>
          <div>
            <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredVisits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
            <div className="text-xl font-semibold text-gray-700 mb-3">
              No student visits scheduled{statusFilter !== 'all' ? ` for "${statusOptions.find(o=>o.value===statusFilter)?.label}"` : ''}
            </div>
            <p className="text-gray-600">
              When students request visits or book, they will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table – responsive with horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Boarding
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredVisits.map((visit) => (
                    <tr 
                      key={visit._id} 
                      className="hover:bg-gray-50/70 transition-colors duration-150"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDateTime(visit.requestedAt || visit.createdAt || Date.now())}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {visit.student?.name || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {visit.student?.contactNumber || visit.contactNumber || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                        {visit.boarding?.title || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {visit.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          {visit.status === 'requested' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await markVisitComplete(visit._id);
                                    setVisits(visits.map(v => v._id === visit._id ? { ...v, status: 'visit_completed' } : v));
                                    await Swal.fire({
                                      title: 'Marked as visit completed',
                                      icon: 'success',
                                      draggable: true
                                    });
                                  } catch (err) { console.error(err); Swal.fire({ title: 'Error', icon: 'error' }); }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                              >
                                Mark Visit Done
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await closeBooking(visit._id);
                                    setVisits(visits.filter(v => v._id !== visit._id));
                                  } catch (e) { console.error(e); }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                              >
                                Close
                              </button>
                            </>
                          )}

                          {visit.status === 'visit_completed' && (
                            <>
                              <button
                                onClick={async () => {
                                  const { value: formValues } = await Swal.fire({
                                    title: 'Confirm Stay',
                                    html:
                                      `<div style='text-align:left;margin-bottom:0.5em;'><label for="swal-input1" style='font-size:0.95em;'>Stay Start Date</label><input id="swal-input1" type="date" class="swal2-input" value="${new Date().toISOString().slice(0,10)}" placeholder="Start Date" /></div>` +
                                      `<div style='text-align:left;'><label for="swal-input2" style='font-size:0.95em;'>Period (months)</label><input id="swal-input2" type="number" min="1" class="swal2-input" value="6" placeholder="Period in months" /></div>`,
                                    focusConfirm: false,
                                    showCancelButton: true,
                                    reverseButtons: true,
                                    confirmButtonText: 'OK',
                                    cancelButtonText: 'Cancel',
                                    preConfirm: () => {
                                      const startDate = document.getElementById('swal-input1').value;
                                      const months = document.getElementById('swal-input2').value;
                                      if (!startDate || !months) {
                                        Swal.showValidationMessage('Please enter both start date and period');
                                        return false;
                                      }
                                      return { startDate, months };
                                    }
                                  });
                                  if (!formValues) return;
                                  try {
                                    await confirmStay(visit._id, { startDate: formValues.startDate, periodMonths: Number(formValues.months) });
                                    setVisits(visits.map(v => v._id === visit._id ? { ...v, status: 'student_stayed' } : v));
                                    await Swal.fire({ title: 'Stay confirmed. Booking moved to student boardings.', icon: 'success', draggable: true });
                                  } catch (err) { console.error(err); Swal.fire({ title: 'Error confirming stay', icon: 'error' }); }
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                              >
                                Confirm Stay
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await closeBooking(visit._id);
                                    setVisits(visits.filter(v => v._id !== visit._id));
                                  } catch (e) { console.error(e); }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerVisits;