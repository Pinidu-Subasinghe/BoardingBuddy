import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getInspectorRatings } from '../../api/api';
import { formatDateTime } from '../../utils/date';

const InspectorReviewedTasks = ({ boardings = [], user }) => {
  const [ratingsByBoarding, setRatingsByBoarding] = useState({});
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [sortOption, setSortOption] = useState('newest-reviewed');

  const reviewedTasks = useMemo(() => {
    return boardings
      .filter((boarding) => {
        const status = String(boarding?.status || '').toLowerCase();
        return status === 'approved' || status === 'rejected';
      });
  }, [boardings]);

  const sortedReviewedTasks = useMemo(() => {
    const getReviewedTime = (task) => {
      const rating = ratingsByBoarding[String(task?._id)];
      return new Date(rating?.createdAt || task?.updatedAt || task?.createdAt || 0).getTime();
    };

    const getStatusPriority = (task) => {
      const status = String(task?.status || '').toLowerCase();
      return status === 'approved' ? 0 : 1;
    };

    const getSafetyPriority = (task) => {
      const rating = ratingsByBoarding[String(task?._id)];
      const safety = String(rating?.safetyBadge || '').toLowerCase();
      if (safety === 'high') return 0;
      if (safety === 'medium') return 1;
      if (safety === 'low') return 2;
      return 3;
    };

    return [...reviewedTasks].sort((a, b) => {
      if (sortOption === 'status-approved-first') {
        const statusDiff = getStatusPriority(a) - getStatusPriority(b);
        if (statusDiff !== 0) return statusDiff;
        return getReviewedTime(b) - getReviewedTime(a);
      }

      if (sortOption === 'safety-high-first') {
        const safetyDiff = getSafetyPriority(a) - getSafetyPriority(b);
        if (safetyDiff !== 0) return safetyDiff;
        return getReviewedTime(b) - getReviewedTime(a);
      }

      return getReviewedTime(b) - getReviewedTime(a);
    });
  }, [reviewedTasks, ratingsByBoarding, sortOption]);

  useEffect(() => {
    const fetchRatingHistory = async () => {
      if (!reviewedTasks.length || !user?._id) {
        setRatingsByBoarding({});
        setLoadingRatings(false);
        return;
      }

      try {
        const reviewedIds = new Set(reviewedTasks.map((task) => String(task._id)));
        const res = await getInspectorRatings();
        const allRatings = Array.isArray(res.data) ? res.data : [];

        const grouped = {};
        allRatings.forEach((rating) => {
          const inspectorId = String(rating?.inspector?._id || rating?.inspector || '');
          const boardingId = String(rating?.boarding?._id || rating?.boarding || '');
          if (!inspectorId || !boardingId) return;
          if (inspectorId !== String(user._id)) return;
          if (!reviewedIds.has(boardingId)) return;

          const previous = grouped[boardingId];
          const prevTime = new Date(previous?.createdAt || 0).getTime();
          const nextTime = new Date(rating?.createdAt || 0).getTime();
          if (!previous || nextTime >= prevTime) {
            grouped[boardingId] = rating;
          }
        });

        setRatingsByBoarding(grouped);
      } catch (err) {
        console.error(err);
        setRatingsByBoarding({});
      } finally {
        setLoadingRatings(false);
      }
    };

    setLoadingRatings(true);
    fetchRatingHistory();
  }, [reviewedTasks, user]);

  const handleDownloadPdf = () => {
    if (!sortedReviewedTasks.length) {
      Swal.fire({
        title: 'No reviewed tasks to export',
        icon: 'info',
        draggable: true
      });
      return;
    }

    if (loadingRatings) {
      Swal.fire({
        title: 'Please wait',
        text: 'Rating details are still loading.',
        icon: 'info',
        draggable: true
      });
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 68, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text('Inspector Reviewed Tasks Report', 40, 42);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - 210, 28);
      doc.text(`Inspector: ${user?.name || 'Inspector'}`, pageWidth - 210, 44);

      const bodyRows = sortedReviewedTasks.map((task, index) => {
        const status = String(task?.status || '').toLowerCase();
        const rating = ratingsByBoarding[String(task._id)];
        const lifestyleDetails =
          rating && (rating.lifestyleRatings || []).length > 0
            ? rating.lifestyleRatings.map((item) => `${item.tag}: ${item.stars}/5`).join('\n')
            : 'N/A';

        const remark = rating?.remark?.trim() || '-';
        const reviewedOn = rating?.createdAt ? formatDateTime(rating.createdAt) : '-';

        return [
          String(index + 1),
          `${task.title || 'Boarding'}\n${task.address || ''} - ${task.city || ''}`,
          `$${task.monthlyRent || 0}`,
          `${task.totalCapacity || 0}`,
          status === 'approved' ? 'Approved' : 'Rejected',
          rating ? `${Math.round(rating.overallPercentage || 0)}%` : 'N/A',
          rating?.safetyBadge || 'N/A',
          lifestyleDetails,
          remark,
          reviewedOn
        ];
      });

      autoTable(doc, {
        startY: 84,
        head: [[
          '#',
          'Boarding Details',
          'Rent',
          'Capacity',
          'Status',
          'Overall',
          'Safety',
          'Lifestyle Ratings',
          'Remark',
          'Reviewed On'
        ]],
        body: bodyRows,
        theme: 'grid',
        styles: {
          fontSize: 9.2,
          cellPadding: 6,
          textColor: [31, 41, 55],
          valign: 'top',
          overflow: 'linebreak'
        },
        bodyStyles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [238, 242, 255],
          textColor: [55, 48, 163],
          fontStyle: 'bold',
          lineColor: [199, 210, 254],
          lineWidth: 0.6
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 116 },
          2: { cellWidth: 42 },
          3: { cellWidth: 62 },
          4: { cellWidth: 68 },
          5: { cellWidth: 46 },
          6: { cellWidth: 48 },
          7: { cellWidth: 168 },
          8: { cellWidth: 142 },
          9: { cellWidth: 73 }
        },
        margin: { left: 24, right: 24, top: 84, bottom: 24 },
      });

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`inspector-reviewed-tasks-${today}.pdf`);

      Swal.fire({
        title: 'PDF downloaded',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'PDF generation failed',
        text: error?.message || 'Could not generate reviewed tasks PDF',
        icon: 'error',
        draggable: true
      });
    }
  };

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-4">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Reviewed Tasks</h2>
        <p className="text-sm text-gray-500">Task history after inspection completion</p>
      </div>

      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-600">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
              {sortedReviewedTasks.length}
            </span>{' '}
            reviewed task{sortedReviewedTasks.length === 1 ? '' : 's'}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="reviewed-task-sort" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sort by
            </label>
            <div className="relative">
              <select
                id="reviewed-task-sort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                className="h-10 min-w-[250px] appearance-none rounded-xl border border-indigo-200 bg-white/90 py-2 pl-3 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="newest-reviewed">Date &amp; Time (Newest Reviewed First)</option>
                <option value="status-approved-first">Status (Approved First)</option>
                <option value="safety-high-first">Safety Badge (High First)</option>
              </select>
              <FiChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loadingRatings || sortedReviewedTasks.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiFileText className="text-base" aria-hidden="true" />
              Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {sortedReviewedTasks.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg text-gray-600">No reviewed tasks yet.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Boarding Name</th>
                  <th className="px-4 sm:px-6 py-3">Location</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Overall</th>
                  <th className="px-4 sm:px-6 py-3">Safety</th>
                  <th className="px-4 sm:px-6 py-3">Reviewed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedReviewedTasks.map((task) => {
                  const status = String(task?.status || '').toLowerCase();
                  const rating = ratingsByBoarding[String(task._id)];
                  const safety = String(rating?.safetyBadge || '').toLowerCase();

                  const statusBadgeClass =
                    status === 'approved'
                      ? 'bg-green-100 text-green-700 ring-green-200'
                      : status === 'rejected'
                      ? 'bg-red-100 text-red-700 ring-red-200'
                      : 'bg-gray-100 text-gray-700 ring-gray-200';

                  const safetyBadgeClass =
                    safety === 'high'
                      ? 'bg-green-100 text-green-700 ring-green-200'
                      : safety === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 ring-yellow-200'
                      : safety === 'low'
                      ? 'bg-red-100 text-red-700 ring-red-200'
                      : 'bg-gray-100 text-gray-700 ring-gray-200';

                  return (
                    <tr key={task._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 align-top font-semibold text-gray-900">
                        {task.title || 'Boarding'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top text-gray-600">
                        {[task.address, task.city].filter(Boolean).join(' - ') || '-'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass}`}
                        >
                          {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                        {loadingRatings ? 'Loading...' : rating ? `${Math.round(rating.overallPercentage || 0)}%` : 'N/A'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                        {loadingRatings ? (
                          'Loading...'
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${safetyBadgeClass}`}
                          >
                            {rating?.safetyBadge || 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap text-gray-600">
                        {loadingRatings ? 'Loading...' : rating?.createdAt ? formatDateTime(rating.createdAt) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorReviewedTasks;