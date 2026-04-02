import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOwnerAnalytics } from '../../api/api';
import { formatDate } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const OwnerAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState({
    totalBoardings: 0,
    totalVisits: 0,
    averageRating: 0,
    occupancyRate: 0,
    totalCapacity: 0,
    occupiedSlots: 0,
    activeStays: 0,
    bookingStatusBreakdown: {
      requested: 0,
      visit_completed: 0,
      student_stayed: 0,
      closed: 0,
      left: 0,
    },
    monthlyVisitTrend: [],
    topBoardingsByOccupancy: [],
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getOwnerAnalytics();
        setAnalytics(response.data || {});
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return <LoadingAnimation text="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      </div>
    );
  }

  const statusMap = analytics.bookingStatusBreakdown || {};
  const trend = analytics.monthlyVisitTrend || [];
  const trendMax = trend.length > 0 ? Math.max(...trend.map((t) => Number(t.count) || 0), 1) : 1;

  const stats = [
    { label: 'Total Boardings', value: analytics.totalBoardings, iconClass: 'bi-house-door-fill' },
    { label: 'Student Visits', value: analytics.totalVisits, iconClass: 'bi-journal-check' },
    { label: 'Average Rating', value: `${Number(analytics.averageRating || 0).toFixed(1)}%`, iconClass: 'bi-star-fill' },
    { label: 'Occupancy Rate', value: `${Number(analytics.occupancyRate || 0).toFixed(1)}%`, iconClass: 'bi-bar-chart-line-fill' }
  ];

  return (
    <div className="p-8">
      <h3 className="text-2xl font-bold mb-6">Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white shadow-md rounded-lg p-6 text-center">
            <div className="text-4xl mb-2 text-indigo-600">
              <i className={`bi ${stat.iconClass}`} aria-hidden="true" />
            </div>
            <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-indigo-600">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Breakdown</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase">Requested</p>
              <p className="text-2xl font-bold text-blue-600">{statusMap.requested || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase">Visit Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{statusMap.visit_completed || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase">Active Stays</p>
              <p className="text-2xl font-bold text-indigo-600">{statusMap.student_stayed || analytics.activeStays || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 uppercase">Closed / Left</p>
              <p className="text-2xl font-bold text-gray-700">{(statusMap.closed || 0) + (statusMap.left || 0)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            Capacity used: <span className="font-semibold text-gray-900">{analytics.occupiedSlots || 0}</span> / <span className="font-semibold text-gray-900">{analytics.totalCapacity || 0}</span>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Visits Last 6 Months</h4>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-500">No visit data yet.</p>
          ) : (
            <div className="space-y-3">
              {trend.map((item) => {
                const count = Number(item.count) || 0;
                const widthPct = Math.max((count / trendMax) * 100, count > 0 ? 8 : 0);
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Boardings by Occupancy</h4>
          {(analytics.topBoardingsByOccupancy || []).length === 0 ? (
            <p className="text-sm text-gray-500">No boardings found.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topBoardingsByOccupancy.map((b) => (
                <div key={b.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{b.title}</p>
                      <p className="text-xs text-gray-500">{b.city} • {b.occupiedSlots}/{b.totalCapacity} occupied</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{Number(b.occupancyRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Booking Activity</h4>
          {(analytics.recentBookings || []).length === 0 ? (
            <p className="text-sm text-gray-500">No booking activity yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentBookings.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{item.boardingTitle}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{item.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Student: {item.studentName}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(item.requestedAt || item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalytics;