import React, { useEffect, useMemo, useState, useContext } from 'react';
import { getBoardings, getInspectorRatings } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import BoardingCard from '../components/BoardingCard';
import BrowseFilterPanel from '../components/BrowseFilterPanel';
import universities from '../data/universities.json';

const Browse = () => {
  const [boardings, setBoardings] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [other, setOther] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amenityOptions, setAmenityOptions] = useState([]);
  const [filters, setFilters] = useState({
    nearMyUniversity: false,
    university: '',
    priceMin: '',
    priceMax: '',
    capacityMin: '',
    ratingMin: '',
    safetyLevel: '',
    amenities: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
    nearMyUniversity: false,
    university: '',
    priceMin: '',
    priceMax: '',
    capacityMin: '',
    ratingMin: '',
    safetyLevel: '',
    amenities: [],
  });
  const { user } = useContext(AuthContext);

  const applyFilters = (items, ratings, active) => {
    const gender = active._gender;
    const nearUni = active._nearUniversity;
    const nearMy = active.nearMyUniversity && nearUni;
    const uni = active.university;
    const priceMin = Number(active.priceMin);
    const priceMax = Number(active.priceMax);
    const capacityMin = Number(active.capacityMin);
    const ratingMin = Number(active.ratingMin);
    const safetyLevel = active.safetyLevel;
    const amenities = active.amenities || [];

    return items.filter((b) => {
      if (gender === 'male' && !(b.boardingType === 'boys' || b.boardingType === 'any')) return false;
      if (gender === 'female' && !(b.boardingType === 'girls' || b.boardingType === 'any')) return false;

      if (nearMy && !((b.nearestUniversities || []).includes(nearUni))) return false;
      if (!nearMy && uni && !((b.nearestUniversities || []).includes(uni))) return false;

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
        setBoardings(items);

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

        const uni = user?.university?.trim();
        const gender = user?.gender?.toLowerCase();
        const filteredItems = applyFilters(items, nextRatingMap, {
          ...appliedFilters,
          _gender: gender,
          _nearUniversity: uni,
        });

        if (uni) {
          const near = filteredItems.filter(b => Array.isArray(b.nearestUniversities) && b.nearestUniversities.includes(uni));
          const oth = filteredItems.filter(b => !(Array.isArray(b.nearestUniversities) && b.nearestUniversities.includes(uni)));
          setNearby(near.map(b => ({ ...b, _rating: nextRatingMap[String(b._id)] })));
          setOther(oth.map(b => ({ ...b, _rating: nextRatingMap[String(b._id)] })));
        } else {
          setNearby([]);
          setOther(filteredItems.map(b => ({ ...b, _rating: nextRatingMap[String(b._id)] })));
        }
      } catch (err) {
        console.error('Error fetching boardings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.university, user?.gender, appliedFilters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
      nearMyUniversity: false,
      university: '',
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

  const userUniversity = user?.university?.trim() || '';
  const canUseMyUniversity = Boolean(userUniversity);
  const filterUniversities = useMemo(
    () => Object.entries(universities).map(([code, name]) => ({ code, name })),
    []
  );
  const userUniversityLabel = userUniversity;

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
            filters={filters}
            onChange={handleFilterChange}
            onToggleAmenity={handleToggleAmenity}
            onApply={handleApply}
            onReset={handleReset}
            canUseMyUniversity={canUseMyUniversity}
            userUniversity={userUniversityLabel}
          />

          <div>
            {loading && boardings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading boarding places...</p>
              </div>
            ) : boardings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No boarding places found</h3>
                <p className="text-gray-600">Try refreshing the list or check back later.</p>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-16">
                {user?.university && (
                  <section>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-5 flex items-center gap-3">
                      Popular among <span className="text-indigo-600 font-bold">{user.university}</span> students
                    </h3>

                    {nearby.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-600">
                        No boarding places found near your university yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
                        {nearby.map(b => (
                          <BoardingCard boarding={b} key={b._id || b.id} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                <section>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-5">
                    {user?.university ? "Other Universities" : "All Available Boardings"}
                  </h3>

                  {other.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-600">
                      No other listings available at the moment.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
                      {other.map(b => (
                        <BoardingCard boarding={b} key={b._id || b.id} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;