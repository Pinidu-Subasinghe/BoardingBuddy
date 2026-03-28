import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelBooking, getMyBookings } from '../../api/api';
import { formatDate, formatDateTime } from '../../utils/date';

const CANCEL_WINDOW_MS = 30 * 60 * 1000;

const ContactOwnerModal = ({ open, onClose, owner }) => {
  if (!open || !owner) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Owner</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Close">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700">Name:</span> {owner.name || 'N/A'}
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span> {owner.email || 'N/A'}
          </div>
          <div>
            <span className="font-medium text-gray-700">Phone:</span> {owner.contactNumber || 'N/A'}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

const StudentBoardings = () => {
  const [boardings, setBoardings] = useState([]);
  const [visitRequests, setVisitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [contactModal, setContactModal] = useState({ open: false, owner: null });
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyBookings();
        const items = res.data || [];
        const visits = items.filter(b => ['requested', 'notified', 'visit_completed'].includes(b.status) && b.boarding);
        // only show confirmed stays
        const stays = items
          .filter(b => b.status === 'student_stayed' && b.boarding)
          .map(b => ({ ...b.boarding, stayStart: b.stayStart, stayEnd: b.stayEnd }));
        setVisitRequests(visits);
        setBoardings(stays);
      } catch (err) {
        console.error('Error fetching boardings', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatRemaining = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const getCancelMeta = (request) => {
    const requestedAt = new Date(request.requestedAt || request.createdAt || Date.now()).getTime();
    const remainingMs = Math.max(0, CANCEL_WINDOW_MS - (nowTs - requestedAt));
    const canCancel = remainingMs > 0 && ['requested', 'notified'].includes(request.status);
    const remainingMin = Math.ceil(remainingMs / (60 * 1000));
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return { canCancel, remainingMin, remainingSeconds };
  };

  const handleCancelRequest = async (request) => {
    const { canCancel } = getCancelMeta(request);
    if (!canCancel) {
      window.alert('Cancellation window expired. You can cancel only within 30 minutes.');
      return;
    }

    const ok = window.confirm('Cancel this visit request? This will permanently delete the request record.');
    if (!ok) return;

    try {
      setCancelLoadingId(request._id);
      await cancelBooking(request._id);
      setVisitRequests((prev) => prev.filter((r) => r._id !== request._id));
    } catch (err) {
      window.alert(err?.message || 'Failed to cancel request');
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (loading) return <p className="px-2 sm:px-0">Loading...</p>;

  return (
    <div className="space-y-8">
      <h3 className="text-xl sm:text-2xl font-bold mb-4">Visit Requests</h3>
      <ContactOwnerModal open={contactModal.open} onClose={() => setContactModal({ open: false, owner: null })} owner={contactModal.owner} />
      {visitRequests.length === 0 ? (
        <p className="text-gray-600">You have no visit requests.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {visitRequests.map((request) => (
            <div key={request._id} className="bg-white p-4 sm:p-5 rounded-lg shadow">
              {(() => {
                const { canCancel, remainingSeconds } = getCancelMeta(request);
                if (!canCancel) return null;
                return (
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="text-xs font-semibold text-red-500">
                      {`You can cancel this request in ${formatRemaining(remainingSeconds)}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelRequest(request)}
                      disabled={cancelLoadingId === request._id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelLoadingId === request._id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                );
              })()}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{request.boarding?.title || 'Boarding'}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.boarding?.address} — {request.boarding?.city}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {request.status || 'requested'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Requested: {formatDateTime(request.requestedAt || request.createdAt)}
                  </div>
                </div>
              </div>
              {request.note && (
                <p className="mt-3 text-sm text-gray-700">
                  <span className="font-medium">Note:</span> {request.note}
                </p>
              )}
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <Link to={`/boardings/${request.boarding?._id}`} className="text-indigo-600 hover:underline text-sm font-medium break-words">
                  View boarding details
                </Link>
                <div className="text-sm text-gray-700 break-words">
                  <span className="font-medium">Owner:</span> {request.boarding?.owner?.name || 'N/A'}
                  <span className="hidden sm:inline mx-2 text-gray-300">|</span>
                  <span className="sm:hidden"> </span>
                  <span className="font-medium">Contact:</span> {request.boarding?.owner?.contactNumber || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-xl sm:text-2xl font-bold mb-4">Current Stay</h3>
      {boardings.length === 0 ? (
        <p className="text-gray-600">You are not currently staying in any boarding.</p>
      ) : (
        <div className="space-y-6">
          {boardings.map(b => (
            <div key={b._id} className="bg-white p-4 sm:p-6 rounded-lg shadow">
              <div className="mb-3">
                <div className="bg-red-100 border border-red-300 text-red-700 text-xs sm:text-sm rounded px-3 sm:px-4 py-2 break-words">
                  <strong>Note:</strong> If you want to leave before the mentioned end date, inform the owner before{' '}
                  <span className="font-semibold">
                    {b.stayEnd ? formatDate(new Date(new Date(b.stayEnd).getTime() - 14 * 24 * 60 * 60 * 1000)) : 'N/A'}
                  </span>.
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-semibold">{b.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{b.address} — {b.city}</p>
                </div>
                <div className="text-right">
                  <div className="text-indigo-600 font-bold">LKR {b.monthlyRent?.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Type: {b.boardingType}</div>
                </div>
              </div>

              {b.description && <p className="mt-4 text-gray-700">{b.description}</p>}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Amenities / Tags</h5>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(b.lifestyleTags || []).length === 0 ? (
                      <span className="text-sm text-gray-500">None listed</span>
                    ) : (
                      (b.lifestyleTags || []).map((t, i) => (
                        <span key={i} className="text-xs bg-green-100 px-3 py-1 rounded-full">{t}</span>
                      ))
                    )}
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700">Nearest Universities</h5>
                    <div className="mt-2">
                      {(b.nearestUniversities || []).length === 0 ? (
                        <p className="text-sm text-gray-500">None listed</p>
                      ) : (
                        <ul className="list-disc ml-5 text-sm text-gray-700">
                          {(b.nearestUniversities || []).map((u, i) => <li key={i}>{u}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>

                  {b.stayStart && b.stayEnd && (
                    <>
                      <div className="mt-4">
                        <span className="font-semibold text-gray-700">Stay:</span>
                        <span className="inline-block mx-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold">
                          {formatDate(b.stayStart)}
                        </span>
                        <span className="font-semibold text-gray-500">to</span>
                        <span className="inline-block mx-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold">
                          {formatDate(b.stayEnd)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Link to={`/boardings/${b._id}`} className="text-indigo-600 hover:underline text-sm font-medium">View boarding details</Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                <div className="min-w-0">
                  {b.location?.lat && b.location?.lng && (
                    <div className="break-all">Location: {b.location.lat}, {b.location.lng}</div>
                  )}
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="mt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-end flex-wrap">
                    {b.owner && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-3 sm:px-4 py-2 shadow-sm w-full sm:w-auto">
                        <span
                          className="text-xs sm:text-sm font-semibold text-yellow-900"
                          style={{ letterSpacing: '0.01em' }}
                        >
                          Need to extend your stay or leave before the end date? Contact the owner for extensions or early leave requests.
                        </span>
                        <button
                          className="w-full sm:w-auto px-4 py-2 bg-yellow-400 text-yellow-900 font-bold rounded hover:bg-yellow-500 transition-colors text-xs shadow"
                          onClick={() => setContactModal({ open: true, owner: b.owner })}
                        >
                          Contact Owner
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBoardings;