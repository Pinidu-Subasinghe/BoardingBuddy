import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { addToWishlist, getMyWishlist, removeFromWishlist } from "../api/api";
import RequestVisitModal from "./RequestVisitModal";

const BoardingDetailsCard = ({
  boarding,
  rating,
  isStaying,
  user,
  visitOpen,
  onRequestVisit,
  onCloseVisit,
  onNotify,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const galleryImages = useMemo(() => {
    const items = [];

    if (boarding?.coverImage) {
      items.push(boarding.coverImage);
    }

    if (Array.isArray(boarding?.images)) {
      boarding.images.forEach((img) => {
        if (img && img !== boarding?.coverImage) {
          items.push(img);
        }
      });
    }

    if (items.length === 0) {
      items.push("https://via.placeholder.com/680x340?text=No+Image");
    }

    return items.slice(0, 6);
  }, [boarding?.coverImage, boarding?.images]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [boarding?._id]);

  useEffect(() => {
    let isMounted = true;

    const checkWishlistStatus = async () => {
      if (user?.role !== "student" || !boarding?._id) {
        if (isMounted) setIsWishlisted(false);
        return;
      }

      try {
        const res = await getMyWishlist();
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.wishlist)
            ? res.data.wishlist
            : [];

        const exists = items.some(
          (item) => String(item?.boarding?._id || item?.boarding) === String(boarding._id),
        );

        if (isMounted) {
          setIsWishlisted(exists);
        }
      } catch {
        if (isMounted) {
          setIsWishlisted(false);
        }
      }
    };

    checkWishlistStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.role, boarding?._id]);

  if (!boarding) return null;

  const goPrevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1,
    );
  };

  const goNextImage = () => {
    setActiveImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleNotify = async (payload = {}) => {
    const { contactNumber, message } = payload || {};
    try {
      const bookingData = {
        boardingId: boarding._id,
        note: message,
      };
      if (contactNumber) bookingData.contactNumber = contactNumber;
      else if (user?.contactNumber)
        bookingData.contactNumber = user.contactNumber;

      await onNotify(bookingData);
      Swal.fire({
        title: "Owner notified.",
        icon: "success",
        draggable: true,
        text: "You will see the visit in your bookings.",
      });
    } catch (err) {
      console.error(err);
      if (
        err?.response?.data?.message &&
        err.response.data.message.includes("pending or active booking")
      ) {
        Swal.fire({
          title: "You have already requested a visit",
          icon: "warning",
          draggable: true,
          text: err.response.data.message,
        });
      } else {
        Swal.fire({
          title: "Unexpected error",
          icon: "error",
          draggable: true,
          text: "Unable to notify owner",
        });
      }
    }
  };

  const handleToggleWishlist = async () => {
    if (user?.role !== "student" || !boarding?._id || wishlistLoading) return;

    try {
      setWishlistLoading(true);

      if (isWishlisted) {
        await removeFromWishlist(boarding._id);
        setIsWishlisted(false);
        Swal.fire({
          title: "Removed from wishlist",
          icon: "success",
          draggable: true,
          timer: 1400,
          showConfirmButton: false,
        });
      } else {
        await addToWishlist(boarding._id);
        setIsWishlisted(true);
        Swal.fire({
          title: "Added to wishlist",
          icon: "success",
          draggable: true,
          timer: 1400,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Wishlist update failed",
        text: err?.message || "Unable to update wishlist",
        icon: "error",
        draggable: true,
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="h-full p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Row 1: Title */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {boarding.title}
            </h2>

            {user?.role === "student" && (
              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  isWishlisted
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-rose-500"
                } ${wishlistLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isWishlisted ? (
                  <FaHeart className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <FiHeart className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
          {/* Row 2: Location + Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location pill */}
            {(boarding.city ||
              boarding.address?.city ||
              boarding.location?.city) && (
              <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                <svg
                  className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  {boarding.city ??
                    boarding.address?.city ??
                    boarding.location?.city}
                </span>
              </div>
            )}
            {/* Staying status pill */}
            {isStaying && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                Currently living here
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-indigo-600 font-bold text-lg">
            LKR {boarding.monthlyRent?.toLocaleString()}
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 text-gray-700 text-sm">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline-block text-indigo-700 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
              </svg>
              Available: <strong>{boarding.availableCapacity ?? boarding.totalCapacity}</strong>
            </div>
            <div>
              Type: {" "}
              <strong>
                {boarding.boardingType === "boys"
                  ? "Male"
                  : boarding.boardingType === "girls"
                    ? "Female"
                    : "Any"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <div className="relative overflow-hidden whitespace-nowrap text-gray-800 leading-relaxed">
          <span>{boarding.description}</span>
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-10"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))",
            }}
          />
        </div>
      </div>

      {/* Grid: Amenities + Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left Column: Amenities & Ratings */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Amenities / Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {(boarding.lifestyleTags || []).length === 0 ? (
                <div className="text-sm text-gray-500">None listed</div>
              ) : (
                boarding.lifestyleTags.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 px-3 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Nearest Universities</h4>
            <div className="flex flex-wrap gap-2">
              {(boarding.nearestUniversities || []).length === 0 ? (
                <div className="text-sm text-gray-500">None listed</div>
              ) : (
                boarding.nearestUniversities.map((u, i) => (
                  <span
                    key={i}
                    className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                  >
                    {u}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Inspector Rating</h4>
            {rating ? (
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  Overall: <strong>{Math.round(rating.overallPercentage)}%</strong>
                </div>
                <div>
                  Safety: <strong className="capitalize">{rating.safetyBadge}</strong>
                </div>
                {rating.inspector && (
                  <div className="text-gray-600">
                    Inspected by: {rating.inspector.name || rating.inspector}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No inspector rating</div>
            )}
          </div>
        </div>

        {/* Right Column: Images */}
        <div className="space-y-3">
          <div className="w-full h-48 md:h-60 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative">
            <img
              src={galleryImages[activeImageIndex]}
              alt={`${boarding.title} ${activeImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/680x340?text=No+Image";
              }}
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 text-white hover:bg-black/70 transition"
                  aria-label="Previous image"
                >
                  {'<'}
                </button>
                <button
                  type="button"
                  onClick={goNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 text-white hover:bg-black/70 transition"
                  aria-label="Next image"
                >
                  {'>'}
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                  {activeImageIndex + 1}/{galleryImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inspector Scores */}
      {rating && (rating.lifestyleRatings || []).length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-center mb-3">Inspector Scores</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rating.lifestyleRatings.map((lr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div className="font-medium text-sm">{lr.tag}</div>
                <div className="text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (lr.stars || 0)
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Visit Button */}
      {user?.role === "student" && !isStaying && (
        <div className="mt-6 text-center">
          <button
            onClick={onRequestVisit}
            className="px-6 py-2 rounded-full text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Request Visit
          </button>
        </div>
      )}

      {/* Modal */}
      <RequestVisitModal
        open={visitOpen}
        onClose={onCloseVisit}
        boarding={boarding}
        user={user}
        onNotify={handleNotify}
      />
    </div>
  );
};

export default BoardingDetailsCard;
