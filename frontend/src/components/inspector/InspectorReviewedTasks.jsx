import React, { useEffect, useMemo, useState } from 'react';
import { getInspectorRatings } from '../../api/api';
import { formatDateTime } from '../../utils/date';

const InspectorReviewedTasks = ({ boardings = [], user }) => {
  const [ratingsByBoarding, setRatingsByBoarding] = useState({});
  const [loadingRatings, setLoadingRatings] = useState(true);

  const reviewedTasks = useMemo(() => {
    return boardings
      .filter((boarding) => {
        const status = String(boarding?.status || '').toLowerCase();
        return status === 'approved' || status === 'rejected';
      })
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [boardings]);

  useEffect(() => {
    const fetchRatingHistory = async () => {
      if (!reviewedTasks.length || !user?._id) {
        setRatingsByBoarding({});
        setLoadingRatings(false);
        return;
      }

      try {
        const reviewedIds = new Set(reviewedTasks.map((task) => String(task._id)));
        const res = await getInspectorRatings();
        const allRatings = Array.isArray(res.data) ? res.data : [];

        const grouped = {};
        allRatings.forEach((rating) => {
          const inspectorId = String(rating?.inspector?._id || rating?.inspector || '');
          const boardingId = String(rating?.boarding?._id || rating?.boarding || '');
          if (!inspectorId || !boardingId) return;
          if (inspectorId !== String(user._id)) return;
          if (!reviewedIds.has(boardingId)) return;

          const previous = grouped[boardingId];
          const prevTime = new Date(previous?.createdAt || 0).getTime();
          const nextTime = new Date(rating?.createdAt || 0).getTime();
          if (!previous || nextTime >= prevTime) {
            grouped[boardingId] = rating;
          }
        });

        setRatingsByBoarding(grouped);
      } catch (err) {
        console.error(err);
        setRatingsByBoarding({});
      } finally {
        setLoadingRatings(false);
      }
    };

    setLoadingRatings(true);
    fetchRatingHistory();
  }, [reviewedTasks, user]);

  return (
    <div className="px-4 py-6 md:px-8">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Reviewed Tasks</h2>
      <p className="mb-6 text-sm text-gray-500">Task history after inspection completion</p>

      {reviewedTasks.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg text-gray-600">No reviewed tasks yet.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Boarding</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Overall</th>
                  <th className="px-4 sm:px-6 py-3">Safety</th>
                  <th className="px-4 sm:px-6 py-3">Lifestyle Ratings</th>
                  <th className="px-4 sm:px-6 py-3">Remark</th>
                  <th className="px-4 sm:px-6 py-3">Reviewed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviewedTasks.map((task) => {
                  const status = String(task?.status || '').toLowerCase();
                  const rating = ratingsByBoarding[String(task._id)];

                  return (
                    <tr key={task._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 align-top">
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {task.address} - {task.city}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Rent: ${task.monthlyRent} | Capacity: {task.totalCapacity}
                        </p>
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            status === 'approved'
                              ? 'bg-green-100 text-green-700 ring-green-200'
                              : 'bg-rose-100 text-rose-700 ring-rose-200'
                          }`}
                        >
                          {status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                        {loadingRatings ? 'Loading...' : rating ? `${Math.round(rating.overallPercentage || 0)}%` : 'N/A'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                        {loadingRatings ? 'Loading...' : rating?.safetyBadge || 'N/A'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top">
                        {loadingRatings ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : rating && (rating.lifestyleRatings || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {rating.lifestyleRatings.map((item, index) => (
                              <span
                                key={`${task._id}-rate-${index}`}
                                className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
                              >
                                {item.tag}: {item.stars}/5
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top">
                        {loadingRatings ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : rating?.remark ? (
                          <p
                            className="text-sm text-gray-700 whitespace-pre-wrap break-words max-w-xs"
                            style={{ overflowWrap: 'anywhere' }}
                          >
                            {rating.remark}
                          </p>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap text-gray-600">
                        {loadingRatings ? 'Loading...' : rating?.createdAt ? formatDateTime(rating.createdAt) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorReviewedTasks;