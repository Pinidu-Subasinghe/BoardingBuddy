import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { getInspectorRatings, getMyWishlist, removeFromWishlist } from '../../api/api';
import BoardingCard from '../BoardingCard';

const StudentWishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWishlist = async () => {
      try {
        setError('');
        const [wishlistResult, ratingsResult] = await Promise.allSettled([
          getMyWishlist(),
          getInspectorRatings(),
        ]);

        if (wishlistResult.status !== 'fulfilled') {
          throw wishlistResult.reason;
        }

        const wishlist = Array.isArray(wishlistResult.value?.data)
          ? wishlistResult.value.data
          : Array.isArray(wishlistResult.value?.data?.wishlist)
          ? wishlistResult.value.data.wishlist
          : [];

        const ratings =
          ratingsResult.status === 'fulfilled' && Array.isArray(ratingsResult.value?.data)
            ? ratingsResult.value.data
            : [];

        const ratingMap = {};
        ratings.forEach((rating) => {
          const boardingId = String(rating?.boarding?._id || rating?.boarding || '');
          if (!boardingId) return;
          ratingMap[boardingId] = rating;
        });

        const normalized = wishlist
          .filter((item) => item?.boarding)
          .map((item) => ({
            ...item.boarding,
            _wishlistCreatedAt: item.createdAt,
            _rating: ratingMap[String(item?.boarding?._id || item?.boarding)] || null,
          }));

        if (isMounted) setItems(normalized);
      } catch (err) {
        if (isMounted) {
          setItems([]);
          setError(err?.message || 'Unable to load wishlist.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWishlist();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (boardingId) => {
    try {
      setRemovingId(boardingId);
      await removeFromWishlist(boardingId);

      setItems((prev) =>
        prev.filter((item) => String(item._id) !== String(boardingId))
      );
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err?.message || 'Failed to remove item',
        icon: 'error',
      });
    } finally {
      setRemovingId(null);
    }
  };

  // 🔹 Skeleton Loader
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow border">
            <div className="h-40 bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold text-gray-900">
            Wishlist
            <FiHeart className="h-6 w-6 sm:h-7 sm:w-7 text-rose-500" aria-hidden="true" />
          </h3>
          <p className="text-sm text-gray-500">
            Boardings you’ve saved for later
          </p>
        </div>

        {items.length > 0 && (
          <span className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium w-fit">
            {items.length} saved
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-white rounded-2xl border p-10 shadow-sm">
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-rose-100 text-rose-500 mb-4">
            <FiHeart size={28} />
          </div>

          <h4 className="text-lg font-semibold text-gray-800">
            No saved boardings
          </h4>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            Tap the heart icon on any boarding to save it here.
          </p>

          <Link
            to="/browse"
            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow"
          >
            Browse Boardings
          </Link>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {items.map((boarding) => (
              <motion.div
                key={boarding._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="group relative"
              >
                <button
                  type="button"
                  onClick={() => handleRemove(boarding._id)}
                  disabled={removingId === boarding._id}
                  aria-label="Remove from wishlist"
                  title={removingId === boarding._id ? 'Removing...' : 'Remove from wishlist'}
                  className="absolute left-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-700 bg-rose-600 text-white shadow-lg ring-2 ring-white/95 hover:bg-rose-700 transition disabled:opacity-50"
                >
                  <FiTrash2 className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Card */}
                <div className="transition-transform duration-200 group-hover:-translate-y-1">
                  <BoardingCard boarding={boarding} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default StudentWishlist;