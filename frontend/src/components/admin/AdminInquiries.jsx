import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  addInquiryResponse,
  applyInquiryPenalty,
  deleteInquiry,
  getAllInquiries,
  updateInquiryStatus,
} from '../../api/api';
import { formatDate } from '../../utils/date';
import InquiryStatusBadge from '../inquiries/InquiryStatusBadge';
import LoadingAnimation from '../LoadingAnimation';

const STATUS_OPTIONS = ['Pending', 'In Review', 'Resolved', 'Rejected'];

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});

  const initializeDrafts = useCallback((items) => {
    const nextDrafts = {};
    items.forEach((inquiry) => {
      const currentPenalty = inquiry.boardingId?.penaltyPoints;
      nextDrafts[inquiry._id] = {
        status: inquiry.status || 'Pending',
        response: inquiry.adminResponse || '',
        points: typeof currentPenalty === 'number' ? currentPenalty : 0,
        penaltyNote: inquiry.boardingId?.penaltyNote || '',
        ownerWarningMessage: inquiry.ownerWarningMessage || '',
      };
    });
    setDrafts(nextDrafts);
  }, []);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllInquiries();
      const items = res.data || [];
      setInquiries(items);
      initializeDrafts(items);
    } catch (err) {
      console.error('Error fetching inquiries', err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [initializeDrafts]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const setDraft = (id, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  };

  const setSavingState = (id, key, value) => {
    setSaving((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleStatusSave = async (inquiryId) => {
    const status = drafts[inquiryId]?.status;
    if (!status) return;
    setSavingState(inquiryId, 'status', true);
    try {
      const res = await updateInquiryStatus(inquiryId, status);
      setInquiries((prev) =>
        prev.map((item) => (item._id === inquiryId ? res.data : item))
      );
      await Swal.fire({
        title: 'Status updated successfully',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error updating status');
    } finally {
      setSavingState(inquiryId, 'status', false);
    }
  };

  const handleResponseSave = async (inquiryId) => {
    const response = drafts[inquiryId]?.response || '';
    setSavingState(inquiryId, 'response', true);
    try {
      const res = await addInquiryResponse(inquiryId, response);
      setInquiries((prev) =>
        prev.map((item) => (item._id === inquiryId ? res.data : item))
      );
      await Swal.fire({
        title: 'Response saved successfully',
        icon: 'success',
        draggable: true,
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error saving response');
    } finally {
      setSavingState(inquiryId, 'response', false);
    }
  };

  const handleDelete = async (inquiryId) => {
    try {
      await deleteInquiry(inquiryId);
      setInquiries((prev) => prev.filter((item) => item._id !== inquiryId));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error deleting inquiry');
    }
  };

  const handlePenalty = async (inquiryId) => {
    const points = Number(drafts[inquiryId]?.points);
    const penaltyNote = drafts[inquiryId]?.penaltyNote || '';
    const ownerWarningMessage = drafts[inquiryId]?.ownerWarningMessage || '';
    if (![0, 1, 2, 3, 4, 5].includes(points)) {
      alert('Penalty points must be between 0 and 5');
      return;
    }
    setSavingState(inquiryId, 'penalty', true);
    try {
      await applyInquiryPenalty(inquiryId, { points, penaltyNote, ownerWarningMessage });
      alert('Penalty points applied');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error applying penalty');
    } finally {
      setSavingState(inquiryId, 'penalty', false);
    }
  };

  const hasInquiries = useMemo(() => inquiries.length > 0, [inquiries]);

  if (loading) return <LoadingAnimation text="Loading Inquiries..." />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm">
        <h3 className="text-2xl font-bold text-gray-900">Inquiries</h3>
        <p className="text-sm text-gray-600 mt-1">Manage user inquiries and admin actions from one place.</p>
      </div>

      {!hasInquiries ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-lg text-gray-700 font-medium">No inquiries submitted yet.</p>
          <p className="mt-1 text-sm text-gray-500">New inquiries will appear here once users submit them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const draft = drafts[inquiry._id] || {};
            const userName = inquiry.userId?.name || 'User';
            const userRole = inquiry.role || inquiry.userId?.role || 'unknown';
            const boardingTitle = inquiry.boardingId?.title;
            const hasBoarding = Boolean(inquiry.boardingId);

            return (
              <div key={inquiry._id} className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 tracking-tight">{inquiry.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted by <span className="font-medium text-gray-700">{userName}</span>
                      {' '}({userRole}) · {formatDate(inquiry.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InquiryStatusBadge status={inquiry.status} />
                    <button
                      type="button"
                      onClick={() => handleDelete(inquiry._id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      aria-label="Delete inquiry"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-500">Category</span>
                    <p className="mt-1">{inquiry.category || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500">Boarding</span>
                    <p className="mt-1">{boardingTitle || '—'}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-semibold text-gray-500">Description</span>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{inquiry.description}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Update Status</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={draft.status || 'Pending'}
                        onChange={(event) => setDraft(inquiry._id, { status: event.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleStatusSave(inquiry._id)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                        disabled={saving[inquiry._id]?.status}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Admin Response</p>
                    <textarea
                      value={draft.response || ''}
                      onChange={(event) => setDraft(inquiry._id, { response: event.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="Type a response"
                    />
                    <button
                      type="button"
                      onClick={() => handleResponseSave(inquiry._id)}
                      className="mt-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                      disabled={saving[inquiry._id]?.response}
                    >
                      Save Response
                    </button>
                  </div>

                  {hasBoarding && (
                    <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Apply Penalty</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={draft.points}
                          onChange={(event) => setDraft(inquiry._id, { points: Number(event.target.value) })}
                          className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          {[0, 1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val} {val === 0 ? '(No penalty)' : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handlePenalty(inquiry._id)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                          disabled={saving[inquiry._id]?.penalty}
                        >
                          Apply
                        </button>
                      </div>
                      <div className="mt-3">
                        <textarea
                          value={draft.penaltyNote || ''}
                          onChange={(event) => setDraft(inquiry._id, { penaltyNote: event.target.value })}
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="Penalty note (optional)"
                        />
                      </div>
                      <div className="mt-3">
                        <textarea
                          value={draft.ownerWarningMessage || ''}
                          onChange={(event) => setDraft(inquiry._id, { ownerWarningMessage: event.target.value })}
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="Message to property owner (optional)"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
