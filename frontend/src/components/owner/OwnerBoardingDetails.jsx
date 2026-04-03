import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getBoarding,
  getInspectorRatings,
  deleteBoarding as apiDeleteBoarding,
  updateBoarding as apiUpdateBoarding,
} from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import LoadingAnimation from "../LoadingAnimation";
import OwnerUpdateBoarding from "./OwnerUpdateBoarding";
import { formatDate } from "../../utils/date";

const OwnerBoardingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [boarding, setBoarding] = useState(null);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getBoarding(id);
        setBoarding(res.data);
        const r = await getInspectorRatings({ boardingId: id });
        setRating((r.data && r.data[0]) || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Determine status display
  const getStatusDisplay = () => {
    if (!boarding) return { text: 'Loading', cls: 'bg-gray-100 text-gray-700' };
    
    if (boarding.status === 'pending' || boarding.status === undefined) {
      if (boarding.assignedInspector) {
        return { 
          text: 'Awaiting Review', 
          cls: 'bg-orange-100 text-orange-800 border-orange-200' 
        };
      }
      return { 
        text: 'Pending Assignment', 
        cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      };
    } else if (boarding.status === 'approved' || boarding.status === 'public' || boarding.status === 'inspected') {
      return { 
        text: 'Approved & Published', 
        cls: 'bg-green-100 text-green-800 border-green-200' 
      };
    } else if (boarding.status === 'rejected') {
      return { 
        text: 'Rejected', 
        cls: 'bg-rose-100 text-rose-800 border-rose-200' 
      };
    }
    return { text: 'Unknown', cls: 'bg-gray-100 text-gray-700' };
  };

  const status = getStatusDisplay();

  // Get cover image
  const coverImage =
    boarding?.coverImage ||
    (Array.isArray(boarding?.images) && boarding.images.length > 0 ? boarding.images[0] : null) ||
    "https://via.placeholder.com/800x400?text=No+Cover+Image";

  const getSafetyColor = (safety) => {
    if (safety === "High") return "bg-green-100 text-green-800";
    if (safety === "Medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPenaltyStyle = (points) => {
    if (points >= 4) return 'bg-red-100 text-red-700';
    if (points >= 2) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete this boarding?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await apiDeleteBoarding(id);
      await Swal.fire({
        title: 'Deleted',
        text: 'Boarding deleted successfully.',
        icon: 'success',
        draggable: true,
      });
      navigate('/owner-dashboard');
    } catch (err) {
      console.error('Error deleting boarding:', err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Error deleting boarding',
        icon: 'error',
      });
    }
  };

  const handleUpdate = async (boardingId, payload) => {
    try {
      const res = await apiUpdateBoarding(boardingId, payload);
      setBoarding(res.data);
      setIsEditing(false);
      await Swal.fire({
        title: 'Boarding updated successfully',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      console.error('Error updating boarding:', err);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Error updating boarding',
        icon: 'error',
      });
    }
  };

  if (loading) return <LoadingAnimation text="Loading boarding details..." />;
  if (!boarding) return <p className="text-center py-10">Boarding not found.</p>;

  return (
    <div className="w-full my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/owner-dashboard?tab=boardings')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className={`inline-block px-4 py-1.5 text-sm font-medium rounded-full border ${status.cls}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[21/9]">
            <img
              src={coverImage}
              alt={boarding.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x400?text=No+Image";
              }}
            />
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-indigo-700 rounded-full text-sm font-medium shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                </svg>
                Available: {boarding.availableCapacity ?? boarding.totalCapacity} / {boarding.totalCapacity}
              </span>
            </div>
          </div>

          {/* Title & Price Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {boarding.title}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {boarding.address}, {boarding.city}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">
                  LKR {boarding.monthlyRent?.toLocaleString()}
                </div>
                <div className="text-gray-500">per month</div>
              </div>
            </div>

            {/* Universities */}
            {boarding.nearestUniversities?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Nearest Universities:</p>
                <div className="flex flex-wrap gap-2">
                  {boarding.nearestUniversities.map((uni, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
                    >
                      {uni}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {boarding.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {boarding.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {boarding.lifestyleTags?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities & Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {boarding.lifestyleTags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {Array.isArray(boarding.images) && boarding.images.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boarding.images.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`${boarding.title} - ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Boarding Type</span>
                <span className="font-medium text-gray-900 capitalize">
                  {boarding.boardingType === "any" ? "Any Gender" : boarding.boardingType}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Capacity</span>
                <span className="font-medium text-gray-900">{boarding.totalCapacity} people</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Available</span>
                <span className="font-medium text-indigo-600">
                  {boarding.availableCapacity ?? boarding.totalCapacity} spots
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">Listed On</span>
                <span className="font-medium text-gray-900">{formatDate(boarding.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Inspection Rating */}
          {rating && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Report</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Overall Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    (rating.overallPercentage || 0) >= 75 ? 'bg-green-100 text-green-800' :
                    (rating.overallPercentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(rating.overallPercentage || 0)}%
                  </span>
                </div>
                {rating.safetyBadge && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Safety Rating</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSafetyColor(rating.safetyBadge)}`}>
                      {rating.safetyBadge}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Penalty Points */}
          <div className={`rounded-xl shadow-sm border border-gray-200 p-6 ${getPenaltyStyle(boarding.penaltyPoints || 0)}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Penalty Points</h2>
              <span className={`h-3 w-3 rounded-full ${
                (boarding.penaltyPoints || 0) >= 4 ? 'bg-red-500' :
                (boarding.penaltyPoints || 0) >= 2 ? 'bg-orange-500' :
                'bg-green-500'
              }`} />
            </div>
            <div className="text-3xl font-bold mb-2">{boarding.penaltyPoints || 0}</div>
            {boarding.penaltyNote && (
              <p className="text-sm opacity-80">{boarding.penaltyNote}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Boarding
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Boarding
              </button>
              <button
                onClick={() => navigate('/owner-dashboard')}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                View All My Boardings
              </button>
            </div>
          </div>
          {/* Update Boarding Modal */}
          {isEditing && (
            <OwnerUpdateBoarding
              boarding={boarding}
              onClose={() => setIsEditing(false)}
              onSubmit={handleUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerBoardingDetails;
