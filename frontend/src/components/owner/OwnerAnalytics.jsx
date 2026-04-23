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

  const exportAnalyticsPDF = async () => {
    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule && (autoTableModule.default || autoTableModule);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const marginLeft = 40;
      const generatedAt = new Date();

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Owner Analytics Report', marginLeft, 40);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated: ${formatDate(generatedAt)} ${generatedAt.toLocaleTimeString()}`, marginLeft, 60);

      const statsHead = [['Metric', 'Value']];
      const statsBody = [
        ['Total Boardings', analytics.totalBoardings ?? 0],
        ['Student Visits', analytics.totalVisits ?? 0],
        ['Average Rating', `${Number(analytics.averageRating || 0).toFixed(1)}%`],
        ['Occupancy Rate', `${Number(analytics.occupancyRate || 0).toFixed(1)}%`],
        ['Total Capacity', analytics.totalCapacity ?? 0],
        ['Occupied Slots', analytics.occupiedSlots ?? 0],
        ['Active Stays', analytics.activeStays ?? 0],
      ];

      const startY = 80;

      if (typeof autoTable === 'function') {
        autoTable(doc, { head: statsHead, body: statsBody, startY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable({ head: statsHead, body: statsBody, startY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
      } else {
        throw new Error('jspdf-autotable not found');
      }

      let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : startY + 40;

      // Booking status breakdown
      const statusMap = analytics.bookingStatusBreakdown || {};
      const statusHead = [['Status', 'Count']];
      const statusBody = [
        ['Requested', statusMap.requested || 0],
        ['Visit Completed', statusMap.visit_completed || 0],
        ['Active Stays', statusMap.student_stayed || analytics.activeStays || 0],
        ['Closed', statusMap.closed || 0],
        ['Left', statusMap.left || 0],
      ];

      if (typeof autoTable === 'function') {
        autoTable(doc, { head: statusHead, body: statusBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
      } else {
        doc.autoTable({ head: statusHead, body: statusBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
      }

      currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : currentY + 80;

      // Monthly visit trend
      const trend = analytics.monthlyVisitTrend || [];
      if (trend.length > 0) {
        const trendHead = [['Month', 'Visits']];
        const trendBody = trend.map((t) => [t.month || '—', String(t.count || 0)]);
        if (typeof autoTable === 'function') {
          autoTable(doc, { head: trendHead, body: trendBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        } else {
          doc.autoTable({ head: trendHead, body: trendBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        }
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : currentY + 80;
      }

      // Top boardings by occupancy
      const top = analytics.topBoardingsByOccupancy || [];
      if (top.length > 0) {
        const topHead = [['Title', 'City', 'Occupied', 'Capacity', 'Occupancy %']];
        const topBody = top.map((b) => [b.title || '—', b.city || '—', String(b.occupiedSlots || 0), String(b.totalCapacity || 0), `${Number(b.occupancyRate || 0).toFixed(1)}%`]);
        if (typeof autoTable === 'function') {
          autoTable(doc, { head: topHead, body: topBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        } else {
          doc.autoTable({ head: topHead, body: topBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        }
        currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : currentY + 80;
      }

      // Recent bookings
      const recent = analytics.recentBookings || [];
      if (recent.length > 0) {
        const recentHead = [['Boarding', 'Student', 'Status', 'Requested']];
        const recentBody = recent.map((r) => [r.boardingTitle || '—', r.studentName || '—', r.status || '—', formatDate(r.requestedAt || r.createdAt)]);
        if (typeof autoTable === 'function') {
          autoTable(doc, { head: recentHead, body: recentBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        } else {
          doc.autoTable({ head: recentHead, body: recentBody, startY: currentY, styles: { fontSize: 10 }, margin: { left: marginLeft, right: 40 } });
        }
      }

      const filename = `owner-analytics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating analytics PDF', err);
      alert('Install `jspdf` and `jspdf-autotable` to enable direct PDF exports: `npm install jspdf jspdf-autotable`');
    }
  };

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

  const breakdownTotal = Object.values(statusMap).reduce((s, v) => s + (Number(v) || 0), 0) || 0;

  const stats = [
    { label: 'Total Boardings', value: analytics.totalBoardings, iconClass: 'bi-house-door-fill', bgClass: 'bg-gradient-to-tr from-indigo-500 to-indigo-400', textClass: 'text-indigo-700' },
    { label: 'Student Visits', value: analytics.totalVisits, iconClass: 'bi-journal-check', bgClass: 'bg-gradient-to-tr from-purple-500 to-purple-400', textClass: 'text-purple-700' },
    { label: 'Average Rating', value: `${Number(analytics.averageRating || 0).toFixed(1)}%`, iconClass: 'bi-star-fill', bgClass: 'bg-gradient-to-tr from-emerald-400 to-emerald-500', textClass: 'text-emerald-700' },
    { label: 'Occupancy Rate', value: `${Number(analytics.occupancyRate || 0).toFixed(1)}%`, iconClass: 'bi-bar-chart-line-fill', bgClass: 'bg-gradient-to-tr from-sky-400 to-sky-500', textClass: 'text-sky-700' }
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Analytics</h3>
        <div>
          <button onClick={exportAnalyticsPDF} className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm hover:opacity-95 transition-shadow shadow-sm">Export as PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white shadow-sm rounded-xl p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${stat.bgClass}`}>
              <i className={`bi ${stat.iconClass} text-xl`} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.textClass}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Breakdown</h4>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {[
                { key: 'requested', label: 'Requested', badge: 'bg-purple-50 text-purple-700 border-purple-100' },
                { key: 'visit_completed', label: 'Visit Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { key: 'student_stayed', label: 'Active Stays', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                { key: 'closed_left', label: 'Closed / Left', badge: 'bg-gray-50 text-gray-700 border-gray-100' },
              ].map((s) => {
                const count = s.key === 'closed_left' ? ((statusMap.closed || 0) + (statusMap.left || 0)) : (statusMap[s.key] || 0);
                const pct = breakdownTotal > 0 ? Math.round((count / breakdownTotal) * 100) : 0;
                return (
                  <div key={s.key} className="flex-1 bg-white border border-gray-100 rounded-md p-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                        <p className="text-xl font-semibold text-gray-900">{count}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${s.badge}`}>
                        {pct}%
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-1 rounded-md bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-800">Capacity used</div>
                <div className="text-xs text-gray-600">{analytics.occupiedSlots || 0} / {analytics.totalCapacity || 0}</div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                {analytics.totalCapacity ? (
                  <div className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${Math.round(((analytics.occupiedSlots || 0) / analytics.totalCapacity) * 100) || 0}%` }} />
                ) : (
                  <div className="h-2 rounded-full bg-gray-200 w-0" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Visits Last 6 Months</h4>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-500">No visit data yet.</p>
          ) : (
            <div className="space-y-3">
              {trend.map((item) => {
                const count = Number(item.count) || 0;
                const widthPct = Math.max((count / trendMax) * 100, count > 0 ? 6 : 0);
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Boardings by Occupancy</h4>
          {(analytics.topBoardingsByOccupancy || []).length === 0 ? (
            <p className="text-sm text-gray-500">No boardings found.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topBoardingsByOccupancy.map((b) => {
                const pct = Math.round(Number(b.occupancyRate || 0));
                return (
                  <div key={b.id || b._id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{b.title}</p>
                        <p className="text-xs text-gray-500">{b.city} • {b.occupiedSlots}/{b.totalCapacity} occupied</p>
                      </div>
                      <div className="w-28 text-right">
                        <div className="text-sm font-bold text-indigo-600">{pct}%</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Booking Activity</h4>
          {(analytics.recentBookings || []).length === 0 ? (
            <p className="text-sm text-gray-500">No booking activity yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentBookings.map((item) => {
                const status = item.status || 'unknown';
                const statusColor = status === 'visit_completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status === 'student_stayed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : status === 'requested' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-700 border-gray-100';
                return (
                  <div key={item.id || item._id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{item.boardingTitle}</p>
                        <p className="text-sm text-gray-600">Student: {item.studentName}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>{status}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(item.requestedAt || item.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalytics;