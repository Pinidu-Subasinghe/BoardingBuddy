import React, { useEffect, useMemo, useRef, useState } from 'react';
import { rateBoarding } from '../../api/api';

const StarPicker = ({ value, onChange }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          type="button"
          key={s}
          onClick={() => onChange(s)}
          className={`text-2xl transition-colors duration-150 hover:scale-110 active:scale-95 ${
            s <= value ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const InspectorAssignedTasks = ({ boardings = [], setBoardings }) => {
  const [active, setActive] = useState(null);
  const [ratings, setRatings] = useState({});
  const [safety, setSafety] = useState('Medium');
  const [remark, setRemark] = useState('');
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const reviewSectionRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const frameId = window.requestAnimationFrame(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [active]);

  const ongoingTasks = useMemo(() => {
    return boardings.filter((boarding) => {
      const normalizedStatus = String(boarding?.status || 'pending').toLowerCase();
      return normalizedStatus === 'pending' || normalizedStatus === 'inspector assigned';
    });
  }, [boardings]);

  const startReview = (boarding) => {
    setActive(boarding);
    const initialRatings = {};
    (boarding.lifestyleTags || []).forEach((tag) => {
      initialRatings[tag] = 0;
    });
    setRatings(initialRatings);
    setSafety('Medium');
    setRemark('');
    setOverallPercentage(0);
    setFormErrors({});
  };

  const updateStar = (tag, value) => {
    const updatedRatings = { ...ratings, [tag]: value };
    setRatings(updatedRatings);

    const totalStars = Object.keys(updatedRatings).length * 5;
    const currentStars = Object.values(updatedRatings).reduce((acc, curr) => acc + curr, 0);
    const percentage = totalStars === 0 ? 0 : Math.round((currentStars / totalStars) * 100);
    setOverallPercentage(percentage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!active) return;

    const errors = {};
    (active.lifestyleTags || []).forEach((tag) => {
      if (!ratings[tag] || ratings[tag] === 0) {
        errors[tag] = 'Required';
      }
    });

    if (!safety) {
      errors.safety = 'Safety badge is required';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const lifestyleRatings = Object.keys(ratings).map((tag) => ({ tag, stars: ratings[tag] }));

    try {
      const res = await rateBoarding({
        boardingId: active._id,
        lifestyleRatings,
        safetyBadge: safety,
        remark,
      });

      setBoardings((prev) =>
        prev.map((boarding) => (boarding._id === active._id ? res.data.boarding : boarding))
      );

      alert('Boarding rated and moved to reviewed tasks');
      setActive(null);
      setFormErrors({});
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error rating boarding');
    }
  };

  const handleReject = async () => {
    if (!active) return;

    const confirmed = window.confirm('Reject this boarding task?');
    if (!confirmed) return;

    try {
      const res = await rateBoarding({ boardingId: active._id, reject: true });

      setBoardings((prev) =>
        prev.map((boarding) => (boarding._id === active._id ? (res.data?.boarding || { ...boarding, status: 'rejected' }) : boarding))
      );

      alert('Boarding rejected and moved to reviewed tasks');
      setActive(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error rejecting boarding');
    }
  };

  return (
    <div className="px-4 py-6 md:px-8">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Assigned Tasks</h2>
      <p className="mb-6 text-sm text-gray-500">Ongoing boarding inspections assigned by admin</p>

      {ongoingTasks.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg text-gray-600">No ongoing assigned tasks right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {ongoingTasks.map((boarding) => (
            <div
              key={boarding._id}
              className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-100/70"
            >
              <span className="absolute right-4 top-4 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/70">
                Ongoing
              </span>

              <h4 className="mb-1 truncate font-semibold text-gray-900">{boarding.title}</h4>
              <p className="mb-1 text-sm text-gray-600">
                {boarding.address} - {boarding.city}
              </p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  Rent: <span className="font-medium text-gray-900">${boarding.monthlyRent}</span>
                </p>
                <p>
                  Capacity: <span className="font-medium text-gray-900">{boarding.totalCapacity}</span>
                </p>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => startReview(boarding)}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:bg-indigo-800"
                >
                  Review Boarding
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div ref={reviewSectionRef} className="mt-10 rounded-2xl bg-white p-6 shadow-md md:p-8">
          <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
            Review: {active.title}
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            {active.address} - {active.city}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-3 block text-base font-semibold text-gray-800">
                Lifestyle Preferences
              </label>
              <div className="space-y-4 rounded-lg bg-gray-50 p-5">
                {(active.lifestyleTags || []).map((tag) => (
                  <div key={tag} className="flex items-center justify-between text-sm sm:text-base">
                    <span className="font-medium text-gray-700">{tag}</span>
                    <div className="flex flex-col items-end">
                      <StarPicker value={ratings[tag] || 0} onChange={(value) => updateStar(tag, value)} />
                      {formErrors[tag] && (
                        <span className="text-xs text-red-500 mt-1 font-bold">Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-right font-medium text-gray-700">
                Overall Rating:{' '}
                <span className="text-xl font-bold text-indigo-600">{overallPercentage}%</span>
              </p>
            </div>

            <div>
              <label className="mb-2 block font-semibold text-gray-800">Safety Badge</label>
              <select
                value={safety}
                onChange={(e) => setSafety(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {formErrors.safety && (
                <span className="text-xs text-red-500 mt-1">{formErrors.safety}</span>
              )}
            </div>

            <div>
              <label className="mb-2 block font-semibold text-gray-800">
                Remark <span className="text-sm font-normal text-gray-500">(optional)</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                placeholder="Add any additional comments or observations..."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="rounded-lg bg-rose-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-rose-700 active:bg-rose-800"
              >
                Reject Boarding
              </button>
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-green-700 active:bg-green-800"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InspectorAssignedTasks;