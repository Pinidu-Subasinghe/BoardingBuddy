import React, { useEffect, useState } from 'react';
import {
  getNotifications,
  createReview,
  getStudentReviews,
  deleteNotification,
  updateReview,
  deleteReview
} from '../../api/api';
import { FaPen, FaTrashAlt } from 'react-icons/fa';
import WriteReviewModal from './WriteReviewModal';
import { formatDateTime } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';




const StudentReviews = () => {
  const [reviewRequests, setReviewRequests] = useState([]);
  const [loadingReviewRequests, setLoadingReviewRequests] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentBoardingId, setCurrentBoardingId] = useState(null);
  const [currentNotificationId, setCurrentNotificationId] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [posting, setPosting] = useState(false);

  // Fetch notifications
  const fetchNotifications = () => {
    setLoadingReviewRequests(true);
    getNotifications().then(res => {
      const requests = (res.data || []).filter(n => n.type === 'review_request');
      setReviewRequests(requests);
    }).catch(() => {
      setReviewRequests([]);
    }).finally(() => {
      setLoadingReviewRequests(false);
    });
  };

  // Fetch student reviews
  const fetchReviews = () => {
    setLoadingReviews(true);
    getStudentReviews().then(res => {
      setReviews(res.data || []);
    }).catch(() => setReviews([])).finally(() => {
      setLoadingReviews(false);
    });
  };

  useEffect(() => {
    fetchNotifications();
    fetchReviews();
  }, []);

  const handleWriteReview = (boardingId, notificationId) => {
    const normalizedId =
      typeof boardingId === 'object' && boardingId !== null
        ? boardingId.$oid || boardingId._id || boardingId.id || (boardingId.toString ? boardingId.toString() : boardingId)
        : boardingId;
    setCurrentBoardingId(typeof normalizedId === 'string' ? normalizedId.trim() : String(normalizedId));
    setCurrentNotificationId(notificationId || null);
    setEditingReview(null);
    setShowModal(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setCurrentBoardingId(null);
    setCurrentNotificationId(null);
    setShowModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || posting) return;
    const shouldDelete = window.confirm('Delete this review? This action cannot be undone.');
    if (!shouldDelete) return;

    setPosting(true);
    try {
      await deleteReview(reviewId);
      fetchReviews();
    } catch (err) {
      const detailed =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete review';
      alert(detailed);
    } finally {
      setPosting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentBoardingId(null);
    setCurrentNotificationId(null);
    setEditingReview(null);
  };

  const handleSubmitReview = async (reviewData) => {
    setPosting(true);
    try {
      if (editingReview?._id) {
        await updateReview(editingReview._id, reviewData);
      } else {
        if (!currentBoardingId) {
          throw new Error('Boarding id is missing for review creation');
        }

        await createReview({
          boarding: String(currentBoardingId).trim(),
          ...reviewData
        });

        if (currentNotificationId) {
          await deleteNotification(currentNotificationId);
        }
      }

      closeModal();
      fetchNotifications();
      fetchReviews();
    } catch (err) {
      console.error('createReview failed:', err);
      const detailed =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to post review';
      alert(detailed);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">My Reviews</h3>

      {!loadingReviewRequests && reviewRequests.length > 0 && (
        <div className="mb-6">
          {reviewRequests.map((n, i) => (
            <div key={n.id || i} className="bg-blue-50 border border-blue-300 text-blue-900 rounded p-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold">{n.message}</span>
                <span className="block text-xs text-gray-500 mt-1">{formatDateTime(n.createdAt)}</span>
              </div>
              {n.data?.boardingId && (
                <button
                  className="mt-2 sm:mt-0 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold"
                  onClick={() => handleWriteReview(n.data.boardingId, n.id)}
                  disabled={posting}
                >
                  Write Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <WriteReviewModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmitReview}
        loading={posting}
        mode={editingReview ? 'edit' : 'create'}
        initialRatings={editingReview?.ratings || null}
        initialComment={editingReview?.comment || ''}
      />

      {/* Student reviews list */}
      {loadingReviews ? (
        <LoadingAnimation text="Loading reviews..." />
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div className="space-y-3 mt-6">
          {reviews.map(r => (
            <div key={r._id} className="bg-white p-4 rounded shadow flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1">{r.boarding?.title || 'Boarding'}</h4>
                <div className="flex flex-wrap gap-4 mb-2">
                  {r.ratings.map(rt => (
                    <span key={rt.tag} className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {rt.tag}: {rt.score}★
                    </span>
                  ))}
                </div>
                {r.comment && (
                  <p className="max-w-full whitespace-pre-wrap break-words text-gray-700 text-sm">
                    {r.comment}
                  </p>
                )}
                <div className="text-xs text-gray-400 mt-2">{formatDateTime(r.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end min-w-[100px] mt-4 sm:mt-0">
                <span className="text-yellow-500 text-lg font-bold flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < Math.round((r.overallRating / 100) * 5) ? '★' : '☆'}
                    </span>
                  ))}
                  <span className="ml-2 text-gray-700 text-base font-semibold">{r.overallRating?.toFixed(1) || '0.0'}%</span>
                </span>
                <span className="text-xs text-gray-500 mt-1">Overall</span>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleEditReview(r)}
                    disabled={posting}
                    aria-label="Edit review"
                    title="Edit review"
                    className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center disabled:opacity-60"
                  >
                    <FaPen className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(r._id)}
                    disabled={posting}
                    aria-label="Delete review"
                    title="Delete review"
                    className="w-9 h-9 rounded-full bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center disabled:opacity-60"
                  >
                    <FaTrashAlt className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentReviews;