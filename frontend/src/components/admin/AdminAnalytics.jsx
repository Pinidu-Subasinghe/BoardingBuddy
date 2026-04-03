import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  getAdminAnalyticsDetails,
  getAdminAnalyticsReportData,
  getAdminAnalyticsSummary,
} from '../../api/api';
import { formatDate, formatDateTime } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const EMPTY_SUMMARY = {
  totalUsers: 0,
  totalStudents: 0,
  totalOwners: 0,
  totalBoardings: 0,
  totalInquiries: 0,
  totalReviews: 0,
  totalPenalties: 0,
};

const EMPTY_DETAILS = {
  userDistribution: [],
  inquiryStatus: [],
  boardingStatus: [],
  penaltyInsights: {
    topPenalized: [],
    penaltyDistribution: [],
  },
  recentActivity: {
    users: [],
    boardings: [],
    inquiries: [],
  },
};

const rangeLabelMap = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom range',
};

const roleLabelMap = {
  all: 'All roles',
  student: 'Students',
  owner: 'Owners',
};

const statusColor = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'In Review': 'bg-blue-100 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

const formatBucketLabel = (key) => {
  if (key === 1) return '1-2 Points';
  if (key === 3) return '3-5 Points';
  return 'Other';
};

const toPercent = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const AdminAnalytics = () => {
  const [filters, setFilters] = useState({
    range: '30d',
    role: 'all',
    startDate: '',
    endDate: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    range: '30d',
    role: 'all',
    startDate: '',
    endDate: '',
  });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const queryParams = useMemo(() => {
    const params = {
      range: appliedFilters.range,
    };

    if (appliedFilters.role !== 'all') {
      params.role = appliedFilters.role;
    }

    if (appliedFilters.range === 'custom') {
      params.startDate = appliedFilters.startDate;
      params.endDate = appliedFilters.endDate;
    }

    return params;
  }, [appliedFilters]);

  const hasValidCustomRange =
    appliedFilters.range !== 'custom' || (Boolean(appliedFilters.startDate) && Boolean(appliedFilters.endDate));

  const fetchAnalytics = useCallback(async () => {
    if (!hasValidCustomRange) {
      setError('Please select both start and end date for custom range.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [summaryRes, detailsRes, reportRes] = await Promise.all([
        getAdminAnalyticsSummary(queryParams),
        getAdminAnalyticsDetails(queryParams),
        getAdminAnalyticsReportData(queryParams),
      ]);

      setSummary(summaryRes.data || EMPTY_SUMMARY);
      setDetails(detailsRes.data || EMPTY_DETAILS);
      setReportData(reportRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data.');
      setSummary(EMPTY_SUMMARY);
      setDetails(EMPTY_DETAILS);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [queryParams, hasValidCustomRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleApplyFilters = () => {
    if (filters.range === 'custom' && (!filters.startDate || !filters.endDate)) {
      setError('Please select both start and end date for custom range.');
      return;
    }

    setError('');
    setAppliedFilters({ ...filters });
  };

  const statCards = [
    { key: 'totalUsers', label: 'Total Users', iconClass: 'bi-people-fill', color: 'text-blue-600' },
    { key: 'totalStudents', label: 'Total Students', iconClass: 'bi-mortarboard-fill', color: 'text-emerald-600' },
    { key: 'totalOwners', label: 'Total Boarding Owners', iconClass: 'bi-building', color: 'text-indigo-600' },
    { key: 'totalBoardings', label: 'Total Boardings', iconClass: 'bi-house-door-fill', color: 'text-cyan-600' },
    { key: 'totalInquiries', label: 'Total Inquiries', iconClass: 'bi-chat-left-text-fill', color: 'text-amber-600' },
    { key: 'totalReviews', label: 'Total Reviews', iconClass: 'bi-star-fill', color: 'text-fuchsia-600' },
    { key: 'totalPenalties', label: 'Total Penalties', iconClass: 'bi-exclamation-octagon-fill', color: 'text-rose-600' },
  ];

  const userCounts = useMemo(() => {
    const source = details.userDistribution || [];
    const counts = { student: 0, owner: 0, admin: 0 };
    source.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item._id)) {
        counts[item._id] = item.count;
      }
    });
    return counts;
  }, [details.userDistribution]);

  const inquiryCounts = useMemo(() => {
    const source = details.inquiryStatus || [];
    const counts = { Pending: 0, 'In Review': 0, Resolved: 0 };
    source.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item._id)) {
        counts[item._id] = item.count;
      }
    });
    return counts;
  }, [details.inquiryStatus]);

  const boardingCounts = useMemo(() => {
    const source = details.boardingStatus || [];
    const counts = { Active: 0, Inactive: 0 };
    source.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(counts, item._id)) {
        counts[item._id] = item.count;
      }
    });
    return counts;
  }, [details.boardingStatus]);

  const userPieData = [
    { label: 'Students', key: 'student', color: '#2563eb', value: userCounts.student },
    { label: 'Owners', key: 'owner', color: '#10b981', value: userCounts.owner },
    { label: 'Admins', key: 'admin', color: '#f59e0b', value: userCounts.admin },
  ];

  const userPieTotal = userPieData.reduce((acc, item) => acc + item.value, 0);

  let start = 0;
  const pieSegments = userPieData
    .map((item) => {
      const percentage = userPieTotal ? (item.value / userPieTotal) * 100 : 0;
      const end = start + percentage;
      const segment = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return segment;
    })
    .join(', ');

  const pieStyle = {
    background: userPieTotal
      ? `conic-gradient(${pieSegments})`
      : 'conic-gradient(#e5e7eb 0% 100%)',
  };

  const hasReportRows = Boolean(
    reportData &&
      ((reportData.users || []).length ||
        (reportData.boardings || []).length ||
        (reportData.inquiries || []).length ||
        (reportData.penalties || []).length)
  );

  const getFilterSummaryText = () => {
    const rangeText = rangeLabelMap[appliedFilters.range] || rangeLabelMap['30d'];
    const roleText = roleLabelMap[appliedFilters.role] || roleLabelMap.all;
    if (appliedFilters.range === 'custom' && appliedFilters.startDate && appliedFilters.endDate) {
      return `${roleText} | ${appliedFilters.startDate} to ${appliedFilters.endDate}`;
    }
    return `${roleText} | ${rangeText}`;
  };

  const exportPDF = async () => {
    if (!reportData || !hasReportRows) {
      setError('No data available for PDF report generation.');
      return;
    }

    try {
      setDownloading(true);
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('BoardingBuddy', 14, 14);
      doc.setFontSize(13);
      doc.text('System Analytics Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 30);
      doc.text(`Filters: ${getFilterSummaryText()}`, 14, 36);

      const summaryRows = [
        ['Total Users', reportData.summary?.totalUsers || 0],
        ['Total Boardings', reportData.summary?.totalBoardings || 0],
        ['Total Inquiries', reportData.summary?.totalInquiries || 0],
        ['Total Reviews', reportData.summary?.totalReviews || 0],
        ['Total Penalties', reportData.summary?.totalPenalties || 0],
      ];

      autoTable(doc, {
        startY: 42,
        head: [['Summary Metric', 'Value']],
        body: summaryRows,
        theme: 'grid',
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Name', 'Email', 'Role', 'Created Date']],
        body: (reportData.users || []).map((item) => [
          item.name,
          item.email,
          item.role,
          formatDate(item.createdAt),
        ]),
        theme: 'striped',
        didDrawPage: () => {
          doc.setFontSize(11);
          doc.text('Users Table', 14, 12);
        },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Boarding Name', 'Owner', 'Status', 'Penalty Points']],
        body: (reportData.boardings || []).map((item) => [
          item.title,
          item.ownerName,
          item.status,
          item.penaltyPoints,
        ]),
        theme: 'striped',
        didDrawPage: () => {
          doc.setFontSize(11);
          doc.text('Boarding Table', 14, 12);
        },
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Title', 'Category', 'Status', 'Date']],
        body: (reportData.inquiries || []).map((item) => [
          item.title,
          item.category,
          item.status,
          formatDate(item.createdAt),
        ]),
        theme: 'striped',
        didDrawPage: () => {
          doc.setFontSize(11);
          doc.text('Inquiry Table', 14, 12);
        },
      });

      const footerY = doc.internal.pageSize.height - 8;
      doc.setFontSize(9);
      doc.text('Generated by BoardingBuddy System', 14, footerY);
      doc.save('boardingbuddy-system-analytics-report.pdf');
    } catch (err) {
      setError(err.message || 'Failed to generate PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  const exportExcel = async () => {
    if (!reportData || !hasReportRows) {
      setError('No data available for Excel report generation.');
      return;
    }

    try {
      setDownloading(true);
      const wb = XLSX.utils.book_new();

      const usersSheet = XLSX.utils.json_to_sheet(
        (reportData.users || []).map((item) => ({
          Name: item.name,
          Email: item.email,
          Role: item.role,
          'Created Date': formatDate(item.createdAt),
        }))
      );

      const boardingsSheet = XLSX.utils.json_to_sheet(
        (reportData.boardings || []).map((item) => ({
          'Boarding Name': item.title,
          Owner: item.ownerName,
          Status: item.status,
          'Penalty Points': item.penaltyPoints,
          'Created Date': formatDate(item.createdAt),
        }))
      );

      const inquiriesSheet = XLSX.utils.json_to_sheet(
        (reportData.inquiries || []).map((item) => ({
          Title: item.title,
          Category: item.category,
          Status: item.status,
          Role: item.role,
          Date: formatDate(item.createdAt),
        }))
      );

      const penaltiesSheet = XLSX.utils.json_to_sheet(
        (reportData.penalties || []).map((item) => ({
          Boarding: item.boarding,
          Owner: item.ownerName,
          'Penalty Points': item.penaltyPoints,
          Status: item.status,
        }))
      );

      XLSX.utils.book_append_sheet(wb, usersSheet, 'Users');
      XLSX.utils.book_append_sheet(wb, boardingsSheet, 'Boardings');
      XLSX.utils.book_append_sheet(wb, inquiriesSheet, 'Inquiries');
      XLSX.utils.book_append_sheet(wb, penaltiesSheet, 'Penalties');

      XLSX.writeFile(wb, 'boardingbuddy-system-analytics-report.xlsx');
    } catch (err) {
      setError(err.message || 'Failed to generate Excel report.');
    } finally {
      setDownloading(false);
    }
  };

  const exportFilteredData = () => {
    if (!reportData || !hasReportRows) {
      setError('No filtered data available to export.');
      return;
    }

    try {
      const data = {
        filters: reportData.filters,
        generatedAt: reportData.generatedAt,
        summary: reportData.summary,
        users: reportData.users,
        boardings: reportData.boardings,
        inquiries: reportData.inquiries,
        penalties: reportData.penalties,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'boardingbuddy-filtered-analytics-data.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export filtered data.');
    }
  };

  if (loading) {
    return <LoadingAnimation text="Loading analytics and reports..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Analytics & Reports</h3>
            <p className="text-sm text-gray-500 mt-1">Comprehensive admin analytics with advanced reporting exports.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date Range</label>
              <select
                value={filters.range}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    range: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                <option value="all">All</option>
                <option value="student">Students</option>
                <option value="owner">Owners</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                disabled={filters.range !== 'custom'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                disabled={filters.range !== 'custom'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={exportPDF}
            disabled={!hasReportRows || downloading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={!hasReportRows || downloading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Download Excel
          </button>
          <button
            type="button"
            onClick={exportFilteredData}
            disabled={!hasReportRows || downloading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export Filtered Data
          </button>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary[card.key] || 0}</p>
              </div>
              <div className={`text-2xl ${card.color}`}>
                <i className={`bi ${card.iconClass}`} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-gray-900">User Distribution</h4>
          <p className="text-xs text-gray-500 mt-1">Students vs Owners vs Admins</p>

          <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48 rounded-full relative" style={pieStyle}>
              <div className="absolute inset-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                {userPieTotal}
              </div>
            </div>

            <div className="space-y-2 w-full">
              {userPieData.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {item.value} ({toPercent(item.value, userPieTotal)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-gray-900">Inquiry Status</h4>
          <p className="text-xs text-gray-500 mt-1">Pending, In Review, Resolved</p>
          <div className="mt-4 space-y-4">
            {Object.keys(inquiryCounts).map((status) => {
              const count = inquiryCounts[status];
              const total = Object.values(inquiryCounts).reduce((acc, value) => acc + value, 0);
              const width = total ? Math.max((count / total) * 100, count > 0 ? 8 : 0) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{status}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-gray-900">Boarding Insights</h4>
          <p className="text-xs text-gray-500 mt-1">Active vs Inactive listings</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700 uppercase">Active</p>
              <p className="text-2xl font-bold text-emerald-700">{boardingCounts.Active}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-700 uppercase">Inactive</p>
              <p className="text-2xl font-bold text-gray-700">{boardingCounts.Inactive}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total listings in selected filters:{' '}
            <span className="font-semibold text-gray-900">
              {boardingCounts.Active + boardingCounts.Inactive}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-lg font-semibold text-gray-900">Penalty Insights</h4>
          <p className="text-xs text-gray-500 mt-1">Top penalized boardings and point ranges</p>

          <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
            {(details.penaltyInsights?.topPenalized || []).length === 0 ? (
              <p className="text-sm text-gray-500">No penalized boardings in this filter.</p>
            ) : (
              details.penaltyInsights.topPenalized.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                    <span className="text-sm font-bold text-rose-600">{item.penaltyPoints} pts</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Owner: {item.ownerName}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2">
            {(details.penaltyInsights?.penaltyDistribution || []).map((bucket) => (
              <div key={String(bucket._id)} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{formatBucketLabel(bucket._id)}</span>
                <span className="font-semibold text-gray-900">{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
        <p className="text-xs text-gray-500 mt-1">Latest user registrations, boardings, and inquiries</p>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-3 max-h-72 overflow-y-auto">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">New Users</h5>
            {(details.recentActivity?.users || []).length === 0 ? (
              <p className="text-sm text-gray-500">No users found.</p>
            ) : (
              <div className="space-y-2">
                {details.recentActivity.users.map((item) => (
                  <div key={item._id} className="border border-gray-100 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="capitalize">{item.role}</span> | {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-3 max-h-72 overflow-y-auto">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">New Boardings</h5>
            {(details.recentActivity?.boardings || []).length === 0 ? (
              <p className="text-sm text-gray-500">No boardings found.</p>
            ) : (
              <div className="space-y-2">
                {details.recentActivity.boardings.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">Owner: {item.ownerName}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${statusColor[item.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                      >
                        {item.status}
                      </span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-3 max-h-72 overflow-y-auto">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">New Inquiries</h5>
            {(details.recentActivity?.inquiries || []).length === 0 ? (
              <p className="text-sm text-gray-500">No inquiries found.</p>
            ) : (
              <div className="space-y-2">
                {details.recentActivity.inquiries.map((item) => (
                  <div key={item._id} className="border border-gray-100 rounded-lg p-2">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {item.category || 'N/A'} | <span className="capitalize">{item.role}</span>
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${statusColor[item.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                      >
                        {item.status}
                      </span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
