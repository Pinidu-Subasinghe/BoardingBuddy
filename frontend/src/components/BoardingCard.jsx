import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/date";

const BoardingCard = ({ boarding }) => {
  const b = boarding || {};
  const coverImage =
    b.coverImage ||
    (Array.isArray(b.images) && b.images.length > 0 ? b.images[0] : null) ||
    "https://via.placeholder.com/400x300?text=No+Image";
  const pct = Math.round(b._rating?.overallPercentage || 0);
  const pctCls =
    pct >= 75
      ? "bg-green-100 text-green-800"
      : pct >= 50
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  const safety = b._rating?.safetyBadge || null;
  const safetyCls =
    safety === "High"
      ? "bg-green-100 text-green-800"
      : safety === "Medium"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  const safetyLabel = safety
    ? String(safety).charAt(0).toUpperCase() + String(safety).slice(1)
    : null;

  return (
    <Link
      to={`/boardings/${b._id}`}
      className="
        group block
        bg-white rounded-xl
        shadow-md hover:shadow-xl
        border border-gray-200
        overflow-hidden
        transition-all duration-300
        hover:-translate-y-1
        h-full flex flex-col
      "
    >
      {/* Image – noticeably shorter */}
      <div className="relative aspect-[5/3] sm:aspect-[16/9] overflow-hidden">
        <img
          src={coverImage}
          alt={b.title || "Boarding place"}
          className="
            w-full h-full object-cover
            transition-transform duration-500
            group-hover:scale-105
          "
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />

        {/* Capacity badge – smaller */}
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
            {b.availableCapacity ?? b.totalCapacity}
          </span>
        </div>
      </div>

      {/* Content – more compact */}
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
            {b.title}
          </h3>

          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-indigo-600">
              LKR {b.monthlyRent?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">/mo</div>
          </div>
        </div>

        {/* Universities – smaller */}
        {b.nearestUniversities && b.nearestUniversities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.nearestUniversities.map((u, idx) => (
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

        {/* Ratings – compact */}
        <div className="flex flex-wrap gap-2">
          {b._rating ? (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${pctCls}`}>
              Inspector {pct}%
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              No rating
            </span>
          )}

          {safety ? (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${safetyCls}`}>
              Safety {safetyLabel}
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Safety N/A
            </span>
          )}
        </div>

        {/* Amenities – single line + truncate */}
        {b.lifestyleTags && b.lifestyleTags.length > 0 && (
          <p className="text-sm text-gray-600 truncate">
            <span className="font-medium text-gray-700">Amenities:</span>{' '}
            {b.lifestyleTags.join(", ")}
          </p>
        )}

        {/* Footer – tighter */}
        <div className="
          mt-auto pt-3 border-t border-gray-100
          flex flex-col sm:flex-row sm:items-center sm:justify-between
          gap-2 text-xs text-gray-600
        ">
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
              {b.boardingType === "boys"
                ? "Boys"
                : b.boardingType === "girls"
                  ? "Girls"
                  : "Any"}
            </span>
          </div>

          <div>{formatDate(b.createdAt)}</div>
        </div>
      </div>
    </Link>
  );
};

export default BoardingCard;