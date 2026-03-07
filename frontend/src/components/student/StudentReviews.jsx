



import React, { useEffect, useState } from 'react';
import { getNotifications, createReview, getStudentReviews, deleteNotification } from '../../api/api';
import WriteReviewModal from './WriteReviewModal';
import { formatDateTime } from '../../utils/date';




const StudentReviews = () => {
  const [reviewRequests, setReviewRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBoardingId, setCurrentBoardingId] = useState(null);
  const [currentNotificationId, setCurrentNotificationId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [posting, setPosting] = useState(false);

  // Fetch notifications
  const fetchNotifications = () => {
    getNotifications().then(res => {
      const requests = (res.data || []).filter(n => n.type === 'review_request');
      setReviewRequests(requests);
    }).catch(() => {});
  };

  // Fetch student reviews
  const fetchReviews = () => {
    getStudentReviews().then(res => {
      setReviews(res.data || []);
    }).catch(() => setReviews([]));
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
    setShowModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    if (!currentBoardingId) return;
    setPosting(true);
    try {
      await createReview({
        boarding: String(currentBoardingId).trim(),
        ...reviewData
      });
      setShowModal(false);
      setCurrentBoardingId(null);
      if (currentNotificationId) {
        await deleteNotification(currentNotificationId);
      }
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

      {reviewRequests.length > 0 && (
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
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitReview}
        loading={posting}
      />

      {/* Student reviews list */}
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div className="space-y-3 mt-6">
          {reviews.map(r => (
            <div key={r._id} className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{r.boarding?.title || 'Boarding'}</h4>
                <div className="flex flex-wrap gap-4 mb-2">
                  {r.ratings.map(rt => (
                    <span key={rt.tag} className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {rt.tag}: {rt.score}★
                    </span>
                  ))}
                </div>
                {r.comment && <p className="text-gray-700 text-sm">{r.comment}</p>}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentReviews;
