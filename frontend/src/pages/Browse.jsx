import React, { useEffect, useMemo, useState, useContext } from 'react';
import { getBoardings, getInspectorRatings } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import BoardingCard from '../components/BoardingCard';
import BrowseFilterPanel from '../components/BrowseFilterPanel';
import LoadingAnimation from '../components/LoadingAnimation';
import universities from '../data/universities.json';

const Browse = () => {
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amenityOptions, setAmenityOptions] = useState([]);
  const [filters, setFilters] = useState({
    university: '',
    nearMyUniversity: false,
    boardingType: '',
    priceMin: '',
    priceMax: '',
    capacityMin: '',
    ratingMin: '',
    safetyLevel: '',
    amenities: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    university: '',
    nearMyUniversity: false,
    boardingType: '',
    priceMin: '',
    priceMax: '',
    capacityMin: '',
    ratingMin: '',
    safetyLevel: '',
    amenities: [],
  });
  const { user } = useContext(AuthContext);
  const userUniversity = user?.university?.trim() || '';

  const applyFilters = (items, ratings, active, currentUserUniversity) => {
    const selectedUniversity = String(active.university || '').trim();
    const nearMyUniversity = Boolean(active.nearMyUniversity);
    const effectiveUniversity = nearMyUniversity
      ? String(currentUserUniversity || '').trim()
      : selectedUniversity;
    const boardingType = String(active.boardingType || '').toLowerCase();
    const priceMin = Number(active.priceMin);
    const priceMax = Number(active.priceMax);
    const capacityMin = Number(active.capacityMin);
    const ratingMin = Number(active.ratingMin);
    const safetyLevel = active.safetyLevel;
    const amenities = active.amenities || [];

    return items.filter((b) => {
      if (effectiveUniversity && !((b.nearestUniversities || []).includes(effectiveUniversity))) {
        return false;
      }

      if (boardingType) {
        const type = String(b.boardingType || '').toLowerCase();
        if (type !== boardingType) return false;
      }

      if (!Number.isNaN(priceMin) && String(active.priceMin).trim() !== '') {
        if ((b.monthlyRent || 0) < priceMin) return false;
      }
      if (!Number.isNaN(priceMax) && String(active.priceMax).trim() !== '') {
        if ((b.monthlyRent || 0) > priceMax) return false;
      }

      if (!Number.isNaN(capacityMin) && String(active.capacityMin).trim() !== '') {
        const cap = b.availableCapacity ?? b.totalCapacity ?? 0;
        if (cap < capacityMin) return false;
      }

      if (!Number.isNaN(ratingMin) && String(active.ratingMin).trim() !== '') {
        const pct = ratings[String(b._id)]?.overallPercentage || 0;
        if (pct < ratingMin) return false;
      }

      if (safetyLevel) {
        const level = String(ratings[String(b._id)]?.safetyBadge || '').toLowerCase();
        if (level !== safetyLevel) return false;
      }

      if (amenities.length > 0) {
        const tags = b.lifestyleTags || [];
        const hasAll = amenities.every((t) => tags.includes(t));
        if (!hasAll) return false;
      }

      return true;
    });
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getBoardings();
        const items = (res.data || []).map(item => item.boarding ? item.boarding : item);

        const rRes = await getInspectorRatings();
        const ratings = (rRes.data || []);
        const nextRatingMap = {};
        ratings.forEach(r => {
          if (!r.boarding) return;
          const bid = (r.boarding._id || r.boarding).toString();
          nextRatingMap[bid] = r;
        });
        const tags = new Set();
        items.forEach((b) => {
          (b.lifestyleTags || []).forEach((t) => tags.add(t));
        });
        setAmenityOptions(Array.from(tags));

        const filteredItems = applyFilters(items, nextRatingMap, appliedFilters, userUniversity);
        setBoardings(filteredItems.map(b => ({ ...b, _rating: nextRatingMap[String(b._id)] })));
      } catch (err) {
        console.error('Error fetching boardings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [appliedFilters, userUniversity]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      if (key === 'university') {
        const nextUniversity = String(value || '').trim();
        return {
          ...prev,
          university: value,
          nearMyUniversity: nextUniversity ? false : prev.nearMyUniversity,
        };
      }

      if (key === 'nearMyUniversity') {
        const nextNearMyUniversity = Boolean(value);
        return {
          ...prev,
          nearMyUniversity: nextNearMyUniversity,
          university: nextNearMyUniversity ? '' : prev.university,
        };
      }

      return { ...prev, [key]: value };
    });
  };

  const handleToggleAmenity = (tag) => {
    setFilters((prev) => {
      const exists = prev.amenities.includes(tag);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((t) => t !== tag)
          : [...prev.amenities, tag],
      };
    });
  };

  const handleApply = () => {
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const reset = {
      university: '',
      nearMyUniversity: false,
      boardingType: '',
      priceMin: '',
      priceMax: '',
      capacityMin: '',
      ratingMin: '',
      safetyLevel: '',
      amenities: [],
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const filterUniversities = useMemo(
    () => Object.entries(universities).map(([code, name]) => ({ code, name })),
    []
  );
  const activeUniversityCode = String(appliedFilters.university || '').trim();
  const titleUniversityCode = appliedFilters.nearMyUniversity ? userUniversity : activeUniversityCode;

  return (
    <div className="min-h-screen bg-gray-50/70 py-8 md:py-10 lg:py-12">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Browse Boardings
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <BrowseFilterPanel
            universities={filterUniversities}
            amenities={amenityOptions}
            userUniversity={userUniversity}
            filters={filters}
            onChange={handleFilterChange}
            onToggleAmenity={handleToggleAmenity}
            onApply={handleApply}
            onReset={handleReset}
          />

          <div>
            {loading && boardings.length === 0 ? (
              <LoadingAnimation text="Loading boarding places..." containerClassName="py-20" />
            ) : boardings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No boarding places found</h3>
                <p className="text-gray-600">Try refreshing the list or check back later.</p>
              </div>
            ) : (
              <section>
                <h3 className="text-2xl font-semibold text-gray-900 mb-5">
                  {titleUniversityCode ? (
                    <>
                      Boardings near{' '}
                      <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {titleUniversityCode}
                      </span>
                    </>
                  ) : (
                    'All Available Boardings'
                  )}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
                  {boardings.map(b => (
                    <BoardingCard boarding={b} key={b._id || b.id} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;