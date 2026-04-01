import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { FaStar } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import { deleteAdminReview, getAdminReviews } from '../../api/api';
import { formatDateTime } from '../../utils/date';

const toStars = (overallRating) => {
  if (typeof overallRating !== 'number') return 0;
  return Math.max(0, Math.min(5, Math.round((overallRating / 100) * 5)));
};

const getMessagePreview = (message, maxWords = 16) => {
  const normalized = (message || '').trim();
  if (!normalized) {
    return { preview: 'No review message', truncated: false };
  }

  const words = normalized.split(/\s+/);
  if (words.length <= maxWords) {
    return { preview: normalized, truncated: false };
  }

  return {
    preview: `${words.slice(0, maxWords).join(' ')} ...`,
    truncated: true
  };
};

const AdminReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
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

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Review Moderation
        </h3>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Loading reviews...</p>
        </div>
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
                {sortedReviews.map((review) => {
                  const stars = toStars(review?.overallRating);
                  const studentName = review?.student?.name || 'Unknown student';
                  const boardingName = review?.boarding?.title || 'Unknown boarding';
                  const message = review?.comment?.trim() || 'No review message';
                  const { preview, truncated } = getMessagePreview(message);

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
                        <p className="text-gray-700 leading-relaxed break-words" title={message}>
                          {preview}
                        </p>
                        {truncated && (
                          <button
                            type="button"
                            onClick={() => openMessageModal(review)}
                            className="mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-sky-600 hover:shadow"
                          >
                            View full
                          </button>
                        )}
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
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeMessageModal}
            aria-label="Close full review message"
          />

          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-wider text-slate-300">Full Review Message</p>
              <h4 className="mt-1 text-base font-semibold sm:text-lg">{messageModal.studentName}</h4>
              <p className="text-xs text-slate-300 sm:text-sm">{messageModal.boardingName}</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">
                {messageModal.message}
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={closeMessageModal}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
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