import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { getMyWishlist, removeFromWishlist } from '../../api/api';
import BoardingCard from '../BoardingCard';
import LoadingAnimation from '../LoadingAnimation';

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
        const res = await getMyWishlist();
        const wishlist = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.wishlist)
            ? res.data.wishlist
            : [];

        const normalized = wishlist
          .filter((item) => item?.boarding)
          .map((item) => ({
            ...item.boarding,
            _wishlistCreatedAt: item.createdAt,
          }));

        if (isMounted) {
          setItems(normalized);
        }
      } catch (err) {
        if (isMounted) {
          setItems([]);
          setError(err?.message || 'Unable to load wishlist right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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
      setItems((prev) => prev.filter((item) => String(item?._id) !== String(boardingId)));
    } catch (err) {
      Swal.fire({
        title: 'Failed to remove item',
        text: err?.message || 'Unable to remove from wishlist',
        icon: 'error',
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return <LoadingAnimation text="Loading wishlist..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Wishlist</h3>
        <p className="text-sm text-gray-500 mt-1">Saved boardings you want to revisit will appear here.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            <FiHeart className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-lg text-gray-700 font-semibold">Your wishlist is empty</p>
          <p className="text-sm text-gray-500 mt-2">Tap the heart icon on boarding details to save boardings for later.</p>

          <div className="mt-5">
            <Link
              to="/browse"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Browse boardings
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
          {items.map((boarding) => (
            <div key={boarding._id} className="space-y-2">
              <BoardingCard boarding={boarding} />
              <button
                type="button"
                onClick={() => handleRemove(boarding._id)}
                disabled={removingId === boarding._id}
                className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removingId === boarding._id ? 'Removing...' : 'Remove from wishlist'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentWishlist;
