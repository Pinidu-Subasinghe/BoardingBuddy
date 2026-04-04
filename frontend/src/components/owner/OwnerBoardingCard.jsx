import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from "../../utils/date";

const OwnerBoardingCard = ({ boarding }) => {
  const navigate = useNavigate();

  // Get cover image
  const coverImage =
    boarding.coverImage ||
    (Array.isArray(boarding.images) && boarding.images.length > 0 ? boarding.images[0] : null) ||
    "https://via.placeholder.com/400x300?text=No+Image";

  // Determine status color class
  let statusCls = '';
  let statusText = boarding.status || 'Pending';

  if (boarding.status === 'pending' || boarding.status === undefined) {
    if (boarding.assignedInspector) {
      statusCls = 'bg-orange-100 text-orange-800 border-orange-200';
      statusText = 'Awaiting Review';
    } else {
      statusCls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      statusText = 'Pending Assignment';
    }
  } else if (boarding.status === 'approved' || boarding.status === 'public' || boarding.status === 'inspected') {
    statusCls = 'bg-green-100 text-green-800 border-green-200';
    statusText = 'Approved & Published';
  } else if (boarding.status === 'rejected') {
    statusCls = 'bg-rose-100 text-rose-800 border-rose-200';
    statusText = 'Rejected';
  } else {
    statusCls = 'bg-gray-100 text-gray-700 border-gray-200';
  }

  const handleCardClick = () => {
    navigate(`/owner/boardings/${boarding._id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="
        group bg-white rounded-xl
        shadow-md hover:shadow-xl
        border border-gray-200
        overflow-hidden
        transition-all duration-300
        hover:-translate-y-1
        h-full flex flex-col
        cursor-pointer
      "
    >
      {/* Image */}
      <div className="relative aspect-[5/3] sm:aspect-[16/9] overflow-hidden">
        <img
          src={coverImage}
          alt={boarding.title || "Boarding place"}
          className="
            w-full h-full object-cover
            transition-transform duration-500
            group-hover:scale-105
          "
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />

        {/* Capacity badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className="
            inline-flex items-center gap-1
            px-2.5 py-1 text-xs font-medium
            bg-white/95 backdrop-blur-sm
            text-indigo-700 rounded-full shadow-sm
          ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
            </svg>
            <span>Available: </span>
            {boarding.availableCapacity ?? boarding.totalCapacity}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow space-y-2.5">
        {/* Title + Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="
            font-semibold text-base sm:text-lg
            text-gray-900 leading-tight
            line-clamp-2
            group-hover:text-indigo-700
            transition-colors
          ">
            {boarding.title}
          </h3>

          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-indigo-600">
              LKR {boarding.monthlyRent?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">/mo</div>
          </div>
        </div>

        {/* Location */}
        <p className="text-sm text-gray-600 truncate">
          {boarding.address} — {boarding.city}
        </p>

        {/* Universities */}
        {boarding.nearestUniversities && boarding.nearestUniversities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {boarding.nearestUniversities.map((u, idx) => (
              <span
                key={idx}
                className="
                  text-xs font-medium px-2.5 py-0.5
                  bg-indigo-50 text-indigo-700
                  rounded-full
                "
              >
                {u}
              </span>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <div>
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${statusCls}`}>
            {statusText}
          </span>
        </div>

        {/* Amenities */}
        {boarding.lifestyleTags && boarding.lifestyleTags.length > 0 && (
          <p className="text-sm text-gray-600 truncate">
            <span className="font-medium text-gray-700">Amenities:</span>{' '}
            {boarding.lifestyleTags.join(", ")}
          </p>
        )}

        {/* Footer - Type and Date */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
              </svg>
              <span>
                {boarding.boardingType === "boys"
                  ? "Boys"
                  : boarding.boardingType === "girls"
                    ? "Girls"
                    : "Any"}
              </span>
            </div>
            <div>{formatDate(boarding.createdAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerBoardingCard;
