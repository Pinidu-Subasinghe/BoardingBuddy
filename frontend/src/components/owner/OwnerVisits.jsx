import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerBookings, markVisitComplete, closeBooking, getOwnerPayments, confirmStay } from '../../api/api';
import Swal from 'sweetalert2';
import { formatDateTime, formatDate } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const OwnerVisits = () => {
  const { user } = useContext(AuthContext);
  const [visits, setVisits] = useState([]);
  const [paidBookingIds, setPaidBookingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('visitors');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Notes state (for calendar page side panel)
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('owner_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [newNote, setNewNote] = useState('');
  
  // Reminder in visitor modal
  const [reminderDate, setReminderDate] = useState('');
  const [reminderText, setReminderText] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    localStorage.setItem('owner_notes', JSON.stringify(notes));
  }, [notes]);

  const fetchVisits = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [bookingsResult, paymentsResult] = await Promise.allSettled([
        getOwnerBookings(),
        getOwnerPayments(),
      ]);

      if (bookingsResult.status === 'fulfilled') {
        const bookingsData = Array.isArray(bookingsResult.value?.data)
          ? bookingsResult.value.data
          : Array.isArray(bookingsResult.value?.data?.bookings)
            ? bookingsResult.value.data.bookings
            : [];
        setVisits(bookingsData);
      } else {
        console.error('Error fetching owner bookings:', bookingsResult.reason);
        if (!silent) {
          setVisits([]);
        }
        setError(bookingsResult.reason?.message || 'Unable to load owner visits right now.');
      }

      if (paymentsResult.status === 'fulfilled') {
        const paymentsData = Array.isArray(paymentsResult.value?.data)
          ? paymentsResult.value.data
          : Array.isArray(paymentsResult.value?.data?.payments)
            ? paymentsResult.value.data.payments
            : [];
        const paidIds = new Set(
          paymentsData
            .filter((p) => p?.status === 'succeeded' && (p?.booking?._id || p?.booking))
            .map((p) => String(p?.booking?._id || p?.booking))
        );
        setPaidBookingIds(paidIds);
      } else {
        console.error('Error fetching owner payments:', paymentsResult.reason);
        setPaidBookingIds(new Set());
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
      setError('Unable to load owner visits right now.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchVisits({ silent: false });
    const intervalId = setInterval(() => fetchVisits({ silent: true }), 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  const getVisitDisplayStatus = useCallback((visit) => {
    if (visit?.status === 'visit_completed' && paidBookingIds.has(String(visit?._id))) {
      return 'payment_received';
    }
    return visit?.status || '';
  }, [paidBookingIds]);

  const filteredVisits = useMemo(() => {
    return visits
      .filter(v => {
        const displayStatus = getVisitDisplayStatus(v);
        return statusFilter === 'all' || displayStatus === statusFilter;
      })
      .filter(v => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (v.student?.name || '').toLowerCase().includes(query) ||
               (v.student?.contactNumber || '').toLowerCase().includes(query) ||
               (v.boarding?.title || '').toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.requestedAt || b.createdAt) - new Date(a.requestedAt || a.createdAt));
  }, [visits, statusFilter, searchQuery, getVisitDisplayStatus]);

  const handleMarkVisitDone = async (visitId) => {
    const confirmResult = await Swal.fire({
      title: 'Mark visit as done?',
      text: 'This will move the request to visited and payment pending.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark done',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await markVisitComplete(visitId);
      setVisits((prev) => prev.map(v => v._id === visitId ? { ...v, status: 'visit_completed' } : v));
      await Swal.fire({
        title: 'Marked as visit completed',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: 'Error',
        text: err?.response?.data?.message || err?.message || 'Failed to mark visit as completed',
        icon: 'error',
      });
    }
  };

  const handleCloseRequest = async (visitId) => {
    const result = await Swal.fire({
      title: 'Close this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    try {
      await closeBooking(visitId);
      setVisits(prev => prev.filter(v => v._id !== visitId));
      Swal.fire({ title: 'Closed', icon: 'success', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to close', icon: 'error' });
    }
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now(),
      text: newNote,
      date: new Date().toISOString()
    };
    setNotes(prev => [note, ...prev]);
    setNewNote('');
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const closeVisitModal = () => {
    setShowVisitModal(false);
    setSelectedVisit(null);
    setReminderDate('');
    setReminderText('');
  };

  const openVisitModal = (visit) => {
    setSelectedVisit(visit);
    setReminderDate('');
    setReminderText('');
    setShowVisitModal(true);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getMonthYear = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const calendarData = useMemo(() => {
    const data = {};
    visits.forEach(v => {
      const dateKey = formatDate(v.requestedAt || v.createdAt);
      if (!data[dateKey]) data[dateKey] = [];
      data[dateKey].push(v);
    });
    return data;
  }, [visits]);

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredVisits.map(v => v._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${selectedIds.size} visits?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete them',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;
    
    try {
      const deletePromises = Array.from(selectedIds).map(id => closeBooking(id));
      await Promise.all(deletePromises);
      setVisits(prev => prev.filter(v => !selectedIds.has(v._id)));
      setSelectedIds(new Set());
      Swal.fire({ title: 'Deleted', icon: 'success', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to delete some visits', icon: 'error' });
    }
  };

  const renderVisitors = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone or boarding..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="requested">Requested</option>
              <option value="notified">Notified</option>
              <option value="visit_completed">Visit Completed (Payment Pending)</option>
              <option value="payment_received">Payment Received</option>
              <option value="visited">Visited</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700">
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={filteredVisits.length > 0 && selectedIds.size === filteredVisits.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredVisits.map((visit) => {
              const displayStatus = getVisitDisplayStatus(visit);

              return (
              <tr key={visit._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(visit._id)}
                    onChange={(e) => handleSelectOne(visit._id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDateTime(visit.requestedAt || visit.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {visit.student?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{visit.student?.name}</p>
                      <p className="text-xs text-gray-600 truncate">{visit.boarding?.title}</p>
                      <p className="text-xs text-gray-500">{visit.student?.contactNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    displayStatus === 'requested' ? 'bg-blue-50 text-blue-700' :
                    displayStatus === 'notified' ? 'bg-yellow-50 text-yellow-700' :
                    displayStatus === 'payment_received' ? 'bg-emerald-50 text-emerald-700' :
                    displayStatus === 'visit_completed' ? 'bg-green-50 text-green-700' :
                    displayStatus === 'visited' ? 'bg-green-50 text-green-700' :
                    displayStatus === 'closed' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {displayStatus === 'requested'
                      ? 'request'
                      : displayStatus === 'payment_received'
                        ? 'Payment Received'
                        : displayStatus?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {visit.status === 'requested' && (
                      <>
                        <button
                          onClick={() => handleMarkVisitDone(visit._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                        >
                          Mark Visit Done
                        </button>
                        <button
                          onClick={() => handleCloseRequest(visit._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                        >
                          Close Request
                        </button>
                      </>
                    )}

                    {visit.status === 'visit_completed' && (
                      <>
                        {paidBookingIds.has(String(visit._id)) ? (
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
                                setVisits((prev) => prev.map(v => v._id === visit._id ? { ...v, status: 'student_stayed' } : v));
                                await Swal.fire({ title: 'Stay confirmed. Booking moved to student boardings.', icon: 'success', draggable: true });
                              } catch (err) { console.error(err); Swal.fire({ title: err?.message || 'Error confirming stay', icon: 'error' }); }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                          >
                            Confirm Stay
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs font-semibold cursor-not-allowed"
                          >
                            Waiting Payment
                          </button>
                        )}
                        {!paidBookingIds.has(String(visit._id)) && (
                          <button
                            onClick={() => handleCloseRequest(visit._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-60"
                          >
                            Close Request
                          </button>
                        )}
                      </>
                    )}

                    {visit.status === 'closed' && (
                      <>
                        {visit.closedByRole === 'student' ? (
                          <span className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                            Student Cancelled
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Closed by Owner
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {filteredVisits.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No visitors found</p>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const today = new Date();
    
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Visit Calendar</h2>
              <p className="text-sm text-gray-500">Track your visitor schedule</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
                {getMonthYear(currentMonth)}
              </span>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status Legend */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Status Legend</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-600">Requested</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Notified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span className="text-sm text-gray-600">Closed</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-gray-200 rounded-lg">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50/50"></div>;
                }
                
                const dateStr = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                const dayVisits = calendarData[dateStr] || [];
                const isToday = today.getDate() === day && 
                                today.getMonth() === currentMonth.getMonth() && 
                                today.getFullYear() === currentMonth.getFullYear();
                
                return (
                  <div 
                    key={day} 
                    className={`min-h-[100px] p-2 border-r border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    {dayVisits.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {dayVisits.slice(0, 3).map((visit, i) => (
                          <button
                            key={i}
                            onClick={() => openVisitModal(visit)}
                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-[1.02] hover:shadow-sm ${
                              visit.status === 'requested' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              visit.status === 'notified' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              visit.status === 'visit_completed' || visit.status === 'visited' ? 'bg-green-50 text-green-700 border border-green-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                            title={`${visit.student?.name} - ${visit.status}`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                              visit.status === 'requested' ? 'bg-blue-500' :
                              visit.status === 'notified' ? 'bg-yellow-500' :
                              visit.status === 'visit_completed' || visit.status === 'visited' ? 'bg-green-500' :
                              'bg-gray-400'
                            }`}>
                              {visit.student?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="truncate">{visit.student?.name?.split(' ')[0]}</span>
                          </button>
                        ))}
                        {dayVisits.length > 3 && (
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notes Section - Side Panel */}
        <div className="w-full lg:w-80 bg-white rounded-lg border border-gray-200 p-4 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
          
          {/* Add Note */}
          <div className="mb-4">
            <textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 resize-none"
              rows={3}
            />
            <button 
              onClick={addNote} 
              className="mt-2 w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Add Note
            </button>
          </div>

          {/* Reminder Section - Only show in Calendar tab */}
          {activeTab === 'calendar' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set Reminder
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Reminder note..."
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                  />
                  <button 
                    onClick={() => {
                      if (!reminderDate || !reminderText) return;
                      const savedReminders = localStorage.getItem('owner_visit_reminders');
                      const reminders = savedReminders ? JSON.parse(savedReminders) : [];
                      reminders.push({
                        id: Date.now(),
                        text: reminderText,
                        date: reminderDate,
                        studentName: selectedVisit?.student?.name,
                        studentId: selectedVisit?.student?._id,
                        visitId: selectedVisit?._id,
                        createdAt: new Date().toISOString()
                      });
                      localStorage.setItem('owner_visit_reminders', JSON.stringify(reminders));
                      Swal.fire({ title: 'Reminder saved', icon: 'success', timer: 1500 });
                      setReminderDate('');
                      setReminderText('');
                    }}
                    disabled={!reminderDate || !reminderText}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 flex-1">{note.text}</p>
                    <button 
                      onClick={() => deleteNote(note.id)} 
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(note.date)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVisitModal = () => {
    if (!showVisitModal || !selectedVisit) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={closeVisitModal} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg">
                {selectedVisit.student?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedVisit.student?.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedVisit.status === 'requested' ? 'bg-blue-100 text-blue-700' :
                  selectedVisit.status === 'notified' ? 'bg-yellow-100 text-yellow-700' :
                  selectedVisit.status === 'visit_completed' ? 'bg-green-100 text-green-700' :
                  selectedVisit.status === 'visited' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedVisit.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <button onClick={closeVisitModal} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Student Details Only */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">{selectedVisit.student?.contactNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{selectedVisit.student?.email || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Boarding</p>
              <p className="text-sm font-medium text-gray-900">{selectedVisit.boarding?.title}</p>
              <p className="text-sm text-gray-600">LKR {selectedVisit.boarding?.monthlyRent?.toLocaleString()}/month</p>
            </div>
            
            {/* Reminder Section - Only show in Calendar tab */}
            {activeTab === 'calendar' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Set Reminder
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Reminder note..."
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    />
                    <button 
                      onClick={() => {
                        if (!reminderDate || !reminderText) return;
                        const savedReminders = localStorage.getItem('owner_visit_reminders');
                        const reminders = savedReminders ? JSON.parse(savedReminders) : [];
                        reminders.push({
                          id: Date.now(),
                          text: reminderText,
                          date: reminderDate,
                          studentName: selectedVisit?.student?.name,
                          studentId: selectedVisit?.student?._id,
                          visitId: selectedVisit?._id,
                          createdAt: new Date().toISOString()
                        });
                        localStorage.setItem('owner_visit_reminders', JSON.stringify(reminders));
                        Swal.fire({ title: 'Reminder saved', icon: 'success', timer: 1500 });
                        setReminderDate('');
                        setReminderText('');
                      }}
                      disabled={!reminderDate || !reminderText}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={closeVisitModal}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingAnimation text="Loading..." containerClassName="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
          <p className="text-sm text-gray-500">Manage your visitors and schedule</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'visitors' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Visitors
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Calendar
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {activeTab === 'visitors' && renderVisitors()}
        {activeTab === 'calendar' && renderCalendar()}

        {renderVisitModal()}
      </div>
    </div>
  );
};

export default OwnerVisits;