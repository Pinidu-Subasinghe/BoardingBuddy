import React, { useEffect, useState } from "react";
import { getReviewsForBoarding } from "../api/api";
import { formatDate } from "../utils/date";
import LoadingAnimation from "./LoadingAnimation";

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

  if (loading) return <LoadingAnimation text="Loading reviews..." />;
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
                <div
                  className="text-gray-700 text-sm whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {review.comment}
                </div>
              ) : (
                <p className="max-w-full truncate text-gray-700 text-sm" title={review.comment}>
                  {review.comment}
                </p>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardingReviews;
