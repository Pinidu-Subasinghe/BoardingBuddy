import React, { useEffect, useState } from "react";
import { getReviewsForBoarding } from "../api/api";
import { formatDate } from "../utils/date";

const BoardingReviews = ({
  boardingId,
  limit,
  showHeader = true,
  title = "Student Reviews",
  subtitle,
  showFullDetails = false,
  starsOnly = false,
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const toStars = (percent) => {
    if (typeof percent !== "number") return 0;
    return Math.max(0, Math.min(5, Math.round((percent / 100) * 5)));
  };

  const truncateComment = (text, maxLength = 120) => {
    if (typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await getReviewsForBoarding(boardingId);
        setReviews(res.data || []);
      } catch (err) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    if (boardingId) fetchReviews();
  }, [boardingId]);

  if (loading) return <div className="py-6 text-center">Loading reviews...</div>;
  if (!reviews.length) {
    return (
      <div className="py-6 text-center text-gray-500">No reviews yet.</div>
    );
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    const aDate = new Date(a.createdAt || 0).getTime();
    const bDate = new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  });

  const visibleReviews =
    typeof limit === "number" ? sortedReviews.slice(0, limit) : sortedReviews;

  return (
    <div>
      {(showHeader || subtitle) && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {showHeader && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div key={review._id} className="bg-gray-50 p-4 rounded shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-gray-800">
                {review.student?.name || "Anonymous"}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>

            {typeof review.overallRating === "number" && (
              <div className="flex items-center gap-2 mb-2">
                {showFullDetails && !starsOnly && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    Overall {Math.round(review.overallRating)}%
                  </span>
                )}
                <div className="text-lg text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>
                    {i < toStars(review.overallRating) ? "★" : "☆"}
                  </span>
                ))}
                </div>
              </div>
            )}

            {showFullDetails && (review.ratings || []).length > 0 && (
              <div className="mb-2 space-y-1">
                {review.ratings.map((r, i) => (
                  <div
                    key={`${review._id}-r-${i}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-gray-700">{r.tag}</span>
                    <span className="text-sm text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < (r.score || 0) ? "★" : "☆"}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {review.comment &&
              (showFullDetails ? (
                <div className="text-gray-700 text-sm">{review.comment}</div>
              ) : (
                <div className="relative overflow-hidden whitespace-nowrap text-gray-700 text-sm">
                  <span>{truncateComment(review.comment)}</span>
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 w-10"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(249,250,251,0), rgba(249,250,251,1))",
                    }}
                  />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardingReviews;
