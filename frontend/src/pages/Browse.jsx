import React, { useEffect, useMemo, useState, useContext } from 'react';
import { getBoardings, getInspectorRatings } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import BoardingCard from '../components/BoardingCard';
import BrowseFilterPanel from '../components/BrowseFilterPanel';
import LoadingAnimation from '../components/LoadingAnimation';
import universities from '../data/universities.json';

const Browse = () => {
  const [boardings, setBoardings] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [other, setOther] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amenityOptions, setAmenityOptions] = useState([]);
  const [filters, setFilters] = useState({
    university: '',
    priceMin: '',
    priceMax: '',
    capacityMin: '',
    ratingMin: '',
    safetyLevel: '',
    amenities: [],
  });
  const [appliedFilters, setAppliedFilters] = useState({
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
    const defaultUniversity = active._defaultUniversity;
    const selectedUniversity = String(active.university || '').trim();
    const effectiveUniversity = selectedUniversity || defaultUniversity;
    const priceMin = Number(active.priceMin);
    const priceMax = Number(active.priceMax);
    const capacityMin = Number(active.capacityMin);
    const ratingMin = Number(active.ratingMin);
    const safetyLevel = active.safetyLevel;
    const amenities = active.amenities || [];

    return items.filter((b) => {
      if (gender === 'male' && !(b.boardingType === 'boys' || b.boardingType === 'any')) return false;
      if (gender === 'female' && !(b.boardingType === 'girls' || b.boardingType === 'any')) return false;

      // Default to the logged-in user's university, but allow explicit university filter override.
      if (effectiveUniversity && !((b.nearestUniversities || []).includes(effectiveUniversity))) return false;

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

        const userUniversity = user?.university?.trim() || '';
        const gender = user?.gender?.toLowerCase();
        const filteredItems = applyFilters(items, nextRatingMap, {
          ...appliedFilters,
          _gender: gender,
          _defaultUniversity: userUniversity,
        });

        if (userUniversity) {
          setNearby(filteredItems.map(b => ({ ...b, _rating: nextRatingMap[String(b._id)] })));
          setOther([]);
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
  const userGender = String(user?.gender || '').toLowerCase();
  const genderFilterNote =
    userGender === 'male'
      ? 'Boardings are filtered by your profile gender. As a male user, you are seeing Boys and Any category boardings only.'
      : userGender === 'female'
        ? 'Boardings are filtered by your profile gender. As a female user, you are seeing Girls and Any category boardings only.'
        : '';
  const activeUniversityFilter = String(appliedFilters.university || '').trim();
  const resultsUniversity = activeUniversityFilter || userUniversity;
  const isViewingOwnUniversity = Boolean(userUniversity) && resultsUniversity === userUniversity;
  const filterUniversities = useMemo(
    () => Object.entries(universities).map(([code, name]) => ({ code, name })),
    []
  );

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
          />

          <div>
            {genderFilterNote && (
              <p className="mb-4 text-sm font-medium text-red-600">
                Note: {genderFilterNote}
              </p>
            )}

            {loading && boardings.length === 0 ? (
              <LoadingAnimation text="Loading boarding places..." containerClassName="py-20" />
            ) : boardings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No boarding places found</h3>
                <p className="text-gray-600">Try refreshing the list or check back later.</p>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-16">
                {userUniversity && (
                  <section>
                    <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-5 whitespace-nowrap overflow-hidden text-ellipsis">
                      {isViewingOwnUniversity ? (
                        <>
                          Popular among <span className="text-indigo-600 font-bold">{userUniversity}</span> students
                        </>
                      ) : (
                        <>
                          Results for <span className="text-indigo-600 font-bold">{resultsUniversity}</span>
                        </>
                      )}
                    </h3>

                    {nearby.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-600">
                        {isViewingOwnUniversity
                          ? 'No boarding places found near your university yet.'
                          : 'No boarding places found for the selected university.'}
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

                {!userUniversity && (
                  <section>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-5">
                      All Available Boardings
                    </h3>

                    {other.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-600">
                        No listings available at the moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
                        {other.map(b => (
                          <BoardingCard boarding={b} key={b._id || b.id} />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;