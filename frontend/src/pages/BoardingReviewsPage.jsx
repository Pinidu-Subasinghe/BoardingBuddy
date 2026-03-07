import React from "react";
import { Link, useParams } from "react-router-dom";
import BoardingReviews from "../components/BoardingReviews";

const BoardingReviewsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50/70 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Reviews
            </h1>
            <p className="text-sm text-gray-500">
              Feedback from students who stayed here
            </p>
          </div>
          <Link
            to={`/boardings/${id}`}
            className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
          >
            Back to details
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <BoardingReviews
            boardingId={id}
            showHeader={false}
            showFullDetails
            starsOnly
          />
        </div>
      </div>
    </div>
  );
};

export default BoardingReviewsPage;
