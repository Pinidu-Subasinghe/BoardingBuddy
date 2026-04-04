import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { FaStar } from 'react-icons/fa';
import { FiDownload, FiSearch, FiTrash2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { deleteAdminReview, getAdminReviews } from '../../api/api';
import { formatDateTime } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const toStars = (overallRating) => {
  if (typeof overallRating !== 'number') return 0;
  return Math.max(0, Math.min(5, Math.round((overallRating / 100) * 5)));
};

const getMessagePreview = (message, maxWords = 12) => {
  const normalized = (message || '').trim();
  if (!normalized) {
    return 'No review message';
  }

  const words = normalized.split(/\s+/);
  return `${words.slice(0, maxWords).join(' ')}${words.length > maxWords ? ' ...' : ''}`;
};

const getRatingsArray = (ratings) => {
  if (!Array.isArray(ratings)) return [];
  return ratings.filter((item) => item && item.tag);
};

const AdminReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [searchBy, setSearchBy] = useState('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageModal, setMessageModal] = useState({
    open: false,
    studentName: '',
    boardingName: '',
    message: ''
  });

  useEffect(() => {
    if (!messageModal.open) return undefined;
    document.body.classList.add('overflow-hidden');

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [messageModal.open]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews();
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load reviews';
      Swal.fire({
        title: 'Could not load reviews',
        text: message,
        icon: 'error',
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedReviews;

    return sortedReviews.filter((review) => {
      const studentName = String(review?.student?.name || '').toLowerCase();
      const boardingName = String(review?.boarding?.title || '').toLowerCase();
      const valueToMatch = searchBy === 'boarding' ? boardingName : studentName;
      return valueToMatch.includes(query);
    });
  }, [sortedReviews, searchBy, searchQuery]);

  const allRatingTags = useMemo(() => {
    const tags = new Set();
    sortedReviews.forEach((review) => {
      getRatingsArray(review?.ratings).forEach((item) => {
        const tag = typeof item.tag === 'string' ? item.tag.trim() : '';
        if (tag) tags.add(tag);
      });
    });
    return Array.from(tags);
  }, [sortedReviews]);

  const handleDelete = async (review) => {
    const studentName = review?.student?.name || 'Unknown student';
    const boardingName = review?.boarding?.title || 'Unknown boarding';

    const result = await Swal.fire({
      title: 'Delete this review?',
      text: `${studentName} - ${boardingName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(review._id);
      await deleteAdminReview(review._id);
      setReviews(prev => prev.filter(item => item._id !== review._id));
      Swal.fire({
        title: 'Review deleted',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete review';
      Swal.fire({
        title: 'Delete failed',
        text: message,
        icon: 'error',
        draggable: true
      });
    } finally {
      setDeletingId('');
    }
  };

  const openMessageModal = (review) => {
    setMessageModal({
      open: true,
      studentName: review?.student?.name || 'Unknown student',
      boardingName: review?.boarding?.title || 'Unknown boarding',
      message: review?.comment?.trim() || 'No review message'
    });
  };

  const closeMessageModal = () => {
    setMessageModal(prev => ({ ...prev, open: false }));
  };

  const handleDownloadReport = () => {
    if (sortedReviews.length === 0) {
      Swal.fire({
        title: 'No reviews to export',
        icon: 'info',
        draggable: true
      });
      return;
    }

    try {
      const reportRows = sortedReviews.map((review, index) => {
        const ratings = getRatingsArray(review?.ratings);
        const ratingMap = {};

        ratings.forEach((item) => {
          const tag = typeof item.tag === 'string' ? item.tag.trim() : '';
          if (!tag) return;
          ratingMap[tag] = item.score;
        });

        const row = {
          No: index + 1,
          'Review Id': review?._id || '',
          Student: review?.student?.name || 'Unknown student',
          Boarding: review?.boarding?.title || 'Unknown boarding',
          'Overall Rating (%)': review?.overallRating ?? 0,
          'Review Message': review?.comment?.trim() || 'No review message',
          'Updated At': formatDateTime(review?.updatedAt || review?.createdAt),
          'Created At': formatDateTime(review?.createdAt),
          'Detailed Ratings': ratings.length
            ? ratings.map((item) => `${item.tag}: ${item.score}/5`).join(' | ')
            : 'No detailed ratings'
        };

        allRatingTags.forEach((tag) => {
          row[`Rating - ${tag}`] = ratingMap[tag] ?? '';
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(reportRows);
      const columnKeys = Object.keys(reportRows[0] || {});
      worksheet['!cols'] = columnKeys.map((key) => {
        const maxValueLength = reportRows.reduce((maxLen, row) => {
          const value = row[key];
          const valueLength = value === null || value === undefined ? 0 : String(value).length;
          return Math.max(maxLen, valueLength);
        }, key.length);

        if (key === 'Review Message' || key === 'Detailed Ratings') {
          return { wch: Math.max(45, Math.min(90, maxValueLength + 4)) };
        }

        if (key.startsWith('Rating - ')) {
          return { wch: Math.max(20, Math.min(28, maxValueLength + 2)) };
        }

        return { wch: Math.max(14, Math.min(36, maxValueLength + 2)) };
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Moderation');

      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `review-moderation-report-${today}.xlsx`);

      Swal.fire({
        title: 'Excel report downloaded',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'Report generation failed',
        text: error?.message || 'Could not generate Excel report',
        icon: 'error',
        draggable: true
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 pr-14 sm:pr-16 md:pr-20 lg:pr-24 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Review Moderation
            </h3>
            <p className="mt-1 text-sm text-gray-600">Monitor review quality and remove harmful feedback when needed.</p>
          </div>

          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={loading || sortedReviews.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiDownload className="text-base" aria-hidden="true" />
            Download Excel Report
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl">
            <select
              value={searchBy}
              onChange={(event) => setSearchBy(event.target.value)}
              className="h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-56"
            >
              <option value="student">Student Name</option>
              <option value="boarding">Boarding Name</option>
            </select>

            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchBy === 'boarding' ? 'Type boarding name...' : 'Type student name...'}
                className="h-11 w-full rounded-xl border border-indigo-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
            {loading ? 'Searching...' : `${filteredReviews.length} of ${sortedReviews.length} reviews`}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingAnimation text="Loading reviews..." />
      ) : sortedReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-lg text-gray-700 font-medium">No reviews available.</p>
          <p className="mt-1 text-sm text-gray-500">New student reviews will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Student</th>
                  <th className="px-4 sm:px-6 py-3">Boarding</th>
                  <th className="px-4 sm:px-6 py-3">Overall Rating</th>
                  <th className="px-4 sm:px-6 py-3">Review Message</th>
                  <th className="px-4 sm:px-6 py-3">Updated</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center text-sm text-gray-500">
                      No matching reviews found. Try typing a few letters from another name.
                    </td>
                  </tr>
                ) : filteredReviews.map((review) => {
                  const stars = toStars(review?.overallRating);
                  const studentName = review?.student?.name || 'Unknown student';
                  const boardingName = review?.boarding?.title || 'Unknown boarding';
                  const message = review?.comment?.trim() || 'No review message';
                  const preview = getMessagePreview(message);

                  return (
                    <tr key={review._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{studentName}</td>
                      <td className="px-4 sm:px-6 py-4">{boardingName}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <FaStar
                              key={index}
                              className={index < stars ? 'opacity-100' : 'opacity-20'}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="ml-2 text-xs text-gray-500">{review?.overallRating || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 max-w-sm">
                        <p className="max-w-[300px] truncate text-gray-700" title={preview}>
                          {preview}
                        </p>
                        <button
                          type="button"
                          onClick={() => openMessageModal(review)}
                          className="mt-2 inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          View more
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDateTime(review?.updatedAt || review?.createdAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(review)}
                            disabled={deletingId === review._id}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label={`Delete review by ${studentName}`}
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMessageModal}
            aria-label="Close full review message"
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-indigo-600">Full Review Message</p>
              <h4 className="mt-1 text-base font-semibold text-gray-900 sm:text-lg">{messageModal.studentName}</h4>
              <p className="text-xs text-gray-600 sm:text-sm">{messageModal.boardingName}</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 sm:text-base">
                {messageModal.message}
              </p>
            </div>

            <div className="flex justify-end border-t border-gray-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeMessageModal}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewModeration;