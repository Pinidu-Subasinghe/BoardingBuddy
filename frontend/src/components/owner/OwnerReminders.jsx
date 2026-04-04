import React, { useState, useEffect } from 'react';
import { formatDateTime } from '../../utils/date';
import Swal from 'sweetalert2';

const OwnerReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const savedReminders = localStorage.getItem('owner_visit_reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDueReminders();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        setPermission(perm);
        if (perm === 'granted') {
          Swal.fire({
            title: 'Notifications Enabled',
            text: 'You will now receive browser notifications when reminders are due',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  };

  const checkDueReminders = () => {
    const now = new Date();
    reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.date);
      if (reminderDate <= now && !reminder.notified) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏰ Reminder: ' + reminder.studentName, {
            body: reminder.text,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: reminder.id
          });
        }
        const updated = reminders.map(r => 
          r.id === reminder.id ? { ...r, notified: true } : r
        );
        setReminders(updated);
        localStorage.setItem('owner_visit_reminders', JSON.stringify(updated));
      }
    });
  };

  const deleteReminder = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Reminder?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    
    if (result.isConfirmed) {
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      localStorage.setItem('owner_visit_reminders', JSON.stringify(updated));
      Swal.fire({
        title: 'Deleted',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const markAsDone = (id) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, done: true, doneAt: new Date().toISOString() } : r
    );
    setReminders(updated);
    localStorage.setItem('owner_visit_reminders', JSON.stringify(updated));
  };

  const getTimeRemaining = (date) => {
    const now = new Date();
    const reminderDate = new Date(date);
    const diff = reminderDate - now;

    if (diff <= 0) return { text: 'Overdue!', urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return { text: `${days}d ${hours}h left`, urgent: false };
    if (hours > 0) return { text: `${hours}h ${minutes}m left`, urgent: hours < 2 };
    return { text: `${minutes}m left`, urgent: true };
  };

  const getUrgencyColor = (date) => {
    const now = new Date();
    const reminderDate = new Date(date);
    const diff = reminderDate - now;

    if (diff <= 0) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: '🔴' };
    if (diff < 1000 * 60 * 60 * 2) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: '⚡' };
    if (diff < 1000 * 60 * 60 * 24) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: '⏰' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '📅' };
  };

  const activeReminders = reminders.filter(r => !r.done).sort((a, b) => new Date(a.date) - new Date(b.date));
  const doneReminders = reminders.filter(r => r.done).sort((a, b) => new Date(b.doneAt || b.date) - new Date(a.doneAt || a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Reminders</h1>
            <p className="text-sm text-gray-500 mt-1">Track your visitor follow-ups and appointments</p>
          </div>
          
          {/* Notification Button */}
          {permission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Enable Notifications
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{activeReminders.length}</p>
                <p className="text-sm text-gray-500 font-medium">Active Reminders</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{doneReminders.length}</p>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active Reminders Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active Reminders
            </h2>
          </div>
          
          {activeReminders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">No active reminders</p>
              <p className="text-sm text-gray-400 mt-1">Add reminders from the Calendar or Visitors page</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeReminders.map(reminder => {
                const urgency = getUrgencyColor(reminder.date);
                const timeRemaining = getTimeRemaining(reminder.date);
                
                return (
                  <div key={reminder.id} className="p-5 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg flex-shrink-0">
                        {reminder.studentName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{reminder.studentName}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
                            <span>{urgency.icon}</span>
                            {timeRemaining.text}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1.5">{reminder.text}</p>
                        <p className="text-sm text-gray-400 mt-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Due: {formatDateTime(reminder.date)}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => markAsDone(reminder.id)}
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all hover:scale-110"
                          title="Mark as done"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Reminders Section */}
        {doneReminders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed ({doneReminders.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {doneReminders.slice(0, 3).map(reminder => (
                <div key={reminder.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-500 line-through">{reminder.studentName}</h3>
                      <p className="text-gray-400 line-through">{reminder.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerReminders;
