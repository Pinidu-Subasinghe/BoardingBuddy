import React, { useEffect, useState, useContext } from 'react';
import { getBoardings, rateBoarding } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import InspectorInquiries from '../components/inspector/InspectorInquiries';

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

const InspectorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [ratings, setRatings] = useState({});
  const [safety, setSafety] = useState('Medium');
  const [remark, setRemark] = useState('');
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [activeMenu, setActiveMenu] = useState('profile');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchBoardings = async () => {
      try {
        const res = await getBoardings();
        setBoardings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoardings();
  }, []);

  // Prevent scrolling when access denied
  React.useEffect(() => {
    if (!user || user.role !== 'inspector') {
      document.body.classList.add('overflow-hidden');
      return () => document.body.classList.remove('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [user]);

  if (!user || user.role !== 'inspector')
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-10 shadow-xl border border-red-100 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <div className="flex justify-center mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" /></svg>
          </div>
          <h1 className="text-4xl font-bold text-red-600 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-lg text-gray-700 mb-3">You do not have permission to view the Inspector Dashboard.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <span className="text-sm text-red-700 font-medium">Reason:</span> <span className="text-sm text-gray-700">This area is restricted to users with the <span className="font-semibold text-red-600">inspector</span> role.</span>
          </div>
          <p className="text-xs text-gray-500">Your role: <span className="font-semibold text-red-600">{user?.role || 'guest'}</span></p>
        </div>
      </div>
    );

  const startReview = (boarding) => {
    setActive(boarding);
    const initialRatings = {};
    (boarding.lifestyleTags || []).forEach((tag) => (initialRatings[tag] = 0));
    setRatings(initialRatings);
    setSafety('Medium');
    setRemark('');
    setOverallPercentage(0);
  };

  const updateStar = (tag, val) => {
    const updatedRatings = { ...ratings, [tag]: val };
    setRatings(updatedRatings);

    const totalStars = Object.keys(updatedRatings).length * 5;
    const currentStars = Object.values(updatedRatings).reduce((acc, curr) => acc + curr, 0);
    const percentage = totalStars === 0 ? 0 : Math.round((currentStars / totalStars) * 100);
    setOverallPercentage(percentage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!active) return;

    // Validation
    const errors = {};
    // All lifestyle tags must be rated (not 0)
    (active.lifestyleTags || []).forEach((tag) => {
      if (!ratings[tag] || ratings[tag] === 0) {
        errors[tag] = 'Required';
      }
    });
    // Safety badge must be selected
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
        prev.map((b) => (b._id === active._id ? res.data.boarding : b))
      );

      alert('Boarding rated and marked as Completed');
      setActive(null);
      setFormErrors({});
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error rating boarding');
    }
  };

  const handleReject = async () => {
    if (!active) return;
    try {
      await rateBoarding({ boardingId: active._id, reject: true });
      setBoardings((prev) => prev.filter((b) => b._id !== active._id));
      alert('Boarding rejected and deleted');
      setActive(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error rejecting boarding');
    }
  };

  const menuItems = [
    { key: 'profile', label: 'My Profile' },
    { key: 'inquiries', label: 'My Inquiries' },
  ];

  return (
    <DashboardShell
      user={user}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      menuItems={menuItems}
      logout={logout}
    >
      <div className="px-4 py-6 md:px-8">
        {activeMenu === 'inquiries' ? (
          <InspectorInquiries />
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
              Assigned Boardings
            </h2>

            {boardings.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                <p className="text-lg text-gray-600">No assigned boardings at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                {boardings.map((b) => (
                  <div
                    key={b._id}
                    className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-100/70"
                  >
                    {b.status === 'approved' && (
                      <span className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200/70">
                        Approved
                      </span>
                    )}
                    {b.status === 'rejected' && (
                      <span className="absolute right-4 top-4 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200/70">
                        Rejected
                      </span>
                    )}

                    <h4 className="mb-1 truncate font-semibold text-gray-900">{b.title}</h4>
                    <p className="mb-1 text-sm text-gray-600">
                      {b.address} — {b.city}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p>Rent: <span className="font-medium text-gray-900">${b.monthlyRent}</span></p>
                      <p>Capacity: <span className="font-medium text-gray-900">{b.totalCapacity}</span></p>
                    </div>

                    <div className="mt-5">
                      {b.status === 'pending' ? (
                        <button
                          onClick={() => startReview(b)}
                          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:bg-indigo-800"
                        >
                          Review Boarding
                        </button>
                      ) : (
                        <div className="inline-flex rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                          Review Completed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {active && (
              <div className="mt-10 rounded-2xl bg-white p-6 shadow-md md:p-8">
                <h3 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
                  Review: {active.title}
                </h3>
                <p className="mb-6 text-sm text-gray-600">
                  {active.address} — {active.city}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-3 block text-base font-semibold text-gray-800">
                      Lifestyle Preferences
                    </label>
                    <div className="space-y-4 rounded-lg bg-gray-50 p-5">
                      {(active.lifestyleTags || []).map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center justify-between text-sm sm:text-base"
                        >
                          <span className="font-medium text-gray-700">{tag}</span>
                          <div className="flex flex-col items-end">
                            <StarPicker
                              value={ratings[tag] || 0}
                              onChange={(v) => updateStar(tag, v)}
                            />
                            {formErrors[tag] && (
                              <span className="text-xs text-red-500 mt-1 font-bold">Required</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-right font-medium text-gray-700">
                      Overall Rating:{' '}
                      <span className="text-xl font-bold text-indigo-600">
                        {overallPercentage}%
                      </span>
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
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default InspectorDashboard;