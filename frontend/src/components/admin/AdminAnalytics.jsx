import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getAdminAnalyticsSummary, getAdminAnalyticsDetails } from '../../api/api';
import { formatDate } from '../../utils/date';

const cardBaseClass = 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalOwners: 0,
    totalBoardings: 0,
    totalInquiries: 0,
    totalReviews: 0,
  });
  const [details, setDetails] = useState({
    userDistribution: { students: 0, owners: 0 },
    boardingStats: { total: 0, active: 0, inactive: 0 },
    inquiryAnalytics: { pending: 0, inReview: 0, resolved: 0, rejected: 0 },
    penaltyInsights: { totalPenaltyPoints: 0, penalizedBoardingsCount: 0, topPenalizedBoardings: [] },
    recentActivities: { newUsers: [], newInquiries: [], newBoardings: [] },
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const [summaryRes, detailsRes] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAdminAnalyticsDetails(),
        ]);
        setSummary(summaryRes.data || {});
        setDetails(detailsRes.data || {});
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const summaryCards = [
    { label: 'Total Users', value: summary.totalUsers || 0, icon: 'bi-people-fill' },
    { label: 'Total Students', value: summary.totalStudents || 0, icon: 'bi-mortarboard-fill' },
    { label: 'Total Boarding Owners', value: summary.totalOwners || 0, icon: 'bi-person-badge-fill' },
    { label: 'Total Boardings', value: summary.totalBoardings || 0, icon: 'bi-house-door-fill' },
    { label: 'Total Inquiries', value: summary.totalInquiries || 0, icon: 'bi-chat-left-text-fill' },
    { label: 'Total Reviews', value: summary.totalReviews || 0, icon: 'bi-star-fill' },
  ];

  const userPie = useMemo(() => {
    const students = Number(details.userDistribution?.students) || 0;
    const owners = Number(details.userDistribution?.owners) || 0;
    const total = students + owners;

    if (total === 0) {
      return {
        style: { background: '#e5e7eb' },
        studentsPct: 0,
        ownersPct: 0,
      };
    }

    const studentsPct = Math.round((students / total) * 100);
    const ownersPct = 100 - studentsPct;

    return {
      style: {
        background: `conic-gradient(#4f46e5 0% ${studentsPct}%, #06b6d4 ${studentsPct}% 100%)`,
      },
      studentsPct,
      ownersPct,
    };
  }, [details.userDistribution]);

  const inquiryBars = useMemo(() => {
    const stats = details.inquiryAnalytics || {};
    const rows = [
      { label: 'Pending', key: 'pending', color: 'bg-amber-500' },
      { label: 'In Review', key: 'inReview', color: 'bg-blue-500' },
      { label: 'Resolved', key: 'resolved', color: 'bg-emerald-500' },
      { label: 'Rejected', key: 'rejected', color: 'bg-rose-500' },
    ];

    const maxVal = Math.max(...rows.map((r) => Number(stats[r.key]) || 0), 1);

    return rows.map((r) => {
      const value = Number(stats[r.key]) || 0;
      const width = value > 0 ? Math.max((value / maxVal) * 100, 8) : 0;
      return { ...r, value, width };
    });
  }, [details.inquiryAnalytics]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('BoardingBuddy Admin Analytics Report', 14, 16);

    autoTable(doc, {
      startY: 24,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', String(summary.totalUsers || 0)],
        ['Total Students', String(summary.totalStudents || 0)],
        ['Total Boarding Owners', String(summary.totalOwners || 0)],
        ['Total Boardings', String(summary.totalBoardings || 0)],
        ['Total Inquiries', String(summary.totalInquiries || 0)],
        ['Total Reviews', String(summary.totalReviews || 0)],
      ],
      theme: 'grid',
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Category', 'Value']],
      body: [
        ['Boardings Active', String(details.boardingStats?.active || 0)],
        ['Boardings Inactive', String(details.boardingStats?.inactive || 0)],
        ['Inquiry Pending', String(details.inquiryAnalytics?.pending || 0)],
        ['Inquiry In Review', String(details.inquiryAnalytics?.inReview || 0)],
        ['Inquiry Resolved', String(details.inquiryAnalytics?.resolved || 0)],
        ['Inquiry Rejected', String(details.inquiryAnalytics?.rejected || 0)],
        ['Total Penalty Points', String(details.penaltyInsights?.totalPenaltyPoints || 0)],
      ],
      theme: 'grid',
    });

    doc.save('admin-analytics-report.pdf');
  };

  const handleDownloadExcel = () => {
    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Users', summary.totalUsers || 0],
      ['Total Students', summary.totalStudents || 0],
      ['Total Boarding Owners', summary.totalOwners || 0],
      ['Total Boardings', summary.totalBoardings || 0],
      ['Total Inquiries', summary.totalInquiries || 0],
      ['Total Reviews', summary.totalReviews || 0],
      ['Boardings Active', details.boardingStats?.active || 0],
      ['Boardings Inactive', details.boardingStats?.inactive || 0],
      ['Inquiry Pending', details.inquiryAnalytics?.pending || 0],
      ['Inquiry In Review', details.inquiryAnalytics?.inReview || 0],
      ['Inquiry Resolved', details.inquiryAnalytics?.resolved || 0],
      ['Inquiry Rejected', details.inquiryAnalytics?.rejected || 0],
      ['Total Penalty Points', details.penaltyInsights?.totalPenaltyPoints || 0],
      ['Penalized Boardings Count', details.penaltyInsights?.penalizedBoardingsCount || 0],
    ];

    const topPenaltyRows = [
      ['Boarding', 'City', 'Status', 'Penalty Points'],
      ...((details.penaltyInsights?.topPenalizedBoardings || []).map((item) => [
        item.title,
        item.city,
        item.status,
        item.penaltyPoints,
      ])),
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsTopPenalties = XLSX.utils.aoa_to_sheet(topPenaltyRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsTopPenalties, 'Top Penalties');
    XLSX.writeFile(wb, 'admin-analytics-report.xlsx');
  };

  if (loading) {
    return <p className="text-gray-600">Loading analytics...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            Download Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={cardBaseClass}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{card.label}</p>
              <i className={`bi ${card.icon} text-indigo-600`} aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h4>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-36 h-36 rounded-full border border-gray-200" style={userPie.style} />
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 p-2">
                <span className="text-sm text-gray-700">Students</span>
                <span className="font-semibold text-indigo-700">
                  {details.userDistribution?.students || 0} ({userPie.studentsPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-cyan-50 border border-cyan-100 p-2">
                <span className="text-sm text-gray-700">Owners</span>
                <span className="font-semibold text-cyan-700">
                  {details.userDistribution?.owners || 0} ({userPie.ownersPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Boarding Statistics</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{details.boardingStats?.total || 0}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs uppercase text-emerald-600">Active</p>
              <p className="text-2xl font-bold text-emerald-700">{details.boardingStats?.active || 0}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs uppercase text-amber-600">Inactive</p>
              <p className="text-2xl font-bold text-amber-700">{details.boardingStats?.inactive || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Analytics</h4>
          <div className="space-y-3">
            {inquiryBars.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Penalty Insights</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase text-gray-500">Total Penalty Points</p>
              <p className="text-2xl font-bold text-gray-900">{details.penaltyInsights?.totalPenaltyPoints || 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase text-gray-500">Penalized Boardings</p>
              <p className="text-2xl font-bold text-gray-900">{details.penaltyInsights?.penalizedBoardingsCount || 0}</p>
            </div>
          </div>

          {(details.penaltyInsights?.topPenalizedBoardings || []).length === 0 ? (
            <p className="text-sm text-gray-500">No penalties applied yet.</p>
          ) : (
            <div className="space-y-2">
              {details.penaltyInsights.topPenalizedBoardings.map((item) => (
                <div key={item._id || item.title} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.city} • {item.status}</p>
                    </div>
                    <span className="text-sm font-bold text-rose-600">{item.penaltyPoints}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Users</h4>
          {(details.recentActivities?.newUsers || []).length === 0 ? (
            <p className="text-sm text-gray-500">No recent users.</p>
          ) : (
            <div className="space-y-2">
              {details.recentActivities.newUsers.map((item) => (
                <div key={item._id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role} • {formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Inquiries</h4>
          {(details.recentActivities?.newInquiries || []).length === 0 ? (
            <p className="text-sm text-gray-500">No recent inquiries.</p>
          ) : (
            <div className="space-y-2">
              {details.recentActivities.newInquiries.map((item) => (
                <div key={item._id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.status} • {formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardBaseClass}>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Boardings</h4>
          {(details.recentActivities?.newBoardings || []).length === 0 ? (
            <p className="text-sm text-gray-500">No recent boardings.</p>
          ) : (
            <div className="space-y-2">
              {details.recentActivities.newBoardings.map((item) => (
                <div key={item._id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.city} • {formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
