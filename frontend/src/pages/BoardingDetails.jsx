import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getBoarding,
  getInspectorRatings,
  createBooking,
  getMyBookings,
} from "../api/api";
import { AuthContext } from "../context/AuthContext";
import BoardingReviews from "../components/BoardingReviews";
import BoardingDetailsCard from "../components/BoardingDetailsCard";
import LoadingAnimation from "../components/LoadingAnimation";

const BoardingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [boarding, setBoarding] = useState(null);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visitOpen, setVisitOpen] = useState(false);
  const [isStaying, setIsStaying] = useState(false);

  const getPenaltyStyle = (points) => {
    if (points >= 4) return 'bg-red-100 text-red-700';
    if (points >= 2) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getPenaltyDotStyle = (points) => {
    if (points >= 4) return 'bg-red-500 ring-red-200';
    if (points >= 2) return 'bg-orange-500 ring-orange-200';
    return 'bg-green-500 ring-green-200';
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getBoarding(id);
        setBoarding(res.data);
        const r = await getInspectorRatings({ boardingId: id });
        setRating((r.data && r.data[0]) || null);

        if (user && user.role === "student") {
          try {
            const bm = await getMyBookings();
            const myBookings = bm.data || [];
            const staying = myBookings.some(
              (b) =>
                b.boarding &&
                String(b.boarding._id) === String(id) &&
                b.status === "student_stayed",
            );
            setIsStaying(staying);
          } catch (e) {
            console.error("Error fetching my bookings", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  const handleRequestVisit = () => {
    if (!user || user.role !== "student") return navigate("/");
    setVisitOpen(true);
  };

  const handleNotify = async (bookingData = {}) => {
    await createBooking(bookingData);
    setVisitOpen(false);
  };

  if (loading) return <LoadingAnimation text="Loading boarding details..." />;
  if (!boarding)
    return <p className="text-center py-10">Boarding not found.</p>;

  return (
    <>
      <div className="w-full my-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <BoardingDetailsCard
            boarding={boarding}
            rating={rating}
            isStaying={isStaying}
            user={user}
            visitOpen={visitOpen}
            onRequestVisit={handleRequestVisit}
            onCloseVisit={() => setVisitOpen(false)}
            onNotify={handleNotify}
          />
        </div>

        <div className="h-full p-6 bg-white rounded-xl shadow-lg flex flex-col gap-5">
          <div className="flex flex-col flex-[2] min-h-0">
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Reviews</h3>
                  <p className="text-sm text-gray-500">
                    Verified feedback from <strong>recent</strong> stays
                  </p>
                </div>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto pr-2"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 24px), transparent)",
                maskImage:
                  "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 24px), transparent)",
              }}
            >
              <BoardingReviews
                boardingId={boarding._id}
                limit={3}
                showHeader={false}
              />
            </div>
            <div className="mt-4">
              <Link
                to={`/boardings/${boarding._id}/reviews`}
                className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 transition"
              >
                View all reviews
              </Link>
            </div>
          </div>

          <div className="flex flex-col flex-[1] rounded-lg border border-gray-200 p-4 relative">
            <span
              className={`absolute right-3 top-3 h-6 w-6 rounded-full ring-4 ${getPenaltyDotStyle(boarding.penaltyPoints || 0)}`}
            />
            <h4 className="text-sm font-semibold text-gray-900">Penalty Points</h4>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPenaltyStyle(boarding.penaltyPoints || 0)}`}
              >
                {boarding.penaltyPoints || 0}
              </span>
            </div>
            {boarding.penaltyNote && (
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                {boarding.penaltyNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardingDetails;
