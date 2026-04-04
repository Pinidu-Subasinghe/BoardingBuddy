import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { createInquiry, deleteInquiry, getBoardings, getMyInquiries } from '../../api/api';
import InquiryCard from './InquiryCard';
import InquiryFormModal from './InquiryFormModal';
import LoadingAnimation from '../LoadingAnimation';

const MyInquiries = () => {
  const { user } = useContext(AuthContext);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [boardings, setBoardings] = useState([]);
  const [boardingsLoading, setBoardingsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const role = user?.role;
  const needsBoardings = role === 'student' || role === 'inspector';

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyInquiries();
      setInquiries(res.data || []);
    } catch (err) {
      console.error('Error fetching inquiries', err);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoardings = useCallback(async () => {
    if (!needsBoardings) return;
    setBoardingsLoading(true);
    try {
      const res = await getBoardings();
      setBoardings(res.data || []);
    } catch (err) {
      console.error('Error fetching boardings', err);
      setBoardings([]);
    } finally {
      setBoardingsLoading(false);
    }
  }, [needsBoardings]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    fetchBoardings();
  }, [fetchBoardings]);

  const handleSubmit = async (payload) => {
    try {
      await createInquiry(payload);
      setModalOpen(false);
      fetchInquiries();
    } catch (err) {
      console.error('Error creating inquiry', err);
      alert(err.response?.data?.message || err.message || 'Error creating inquiry');
    }
  };

  if (loading) return <LoadingAnimation text="Loading My Inquiries..." />;

  const isOwner = role === 'owner';
  const ownerWarnings = isOwner
    ? inquiries.filter((item) => item.ownerWarningMessage || item.penaltyNote)
    : [];
  const ownInquiries = isOwner
    ? inquiries.filter((item) => !item.ownerWarningMessage && !item.penaltyNote)
    : inquiries;

  const isSelectableView = role === 'student' || role === 'inspector';
  const listClass = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
    : 'space-y-3';

  const handleDelete = async (inquiry) => {
    try {
      await deleteInquiry(inquiry._id);
      setInquiries((prev) => prev.filter((item) => item._id !== inquiry._id));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error deleting inquiry');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">My Inquiries</h3>
            <p className="text-sm text-gray-600 mt-1">Track inquiries, status updates, and responses in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {isSelectableView && (
            <div className="flex items-center rounded-xl border border-indigo-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                <i className="bi bi-list-ul" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Add Inquiry
          </button>
          </div>
        </div>
      </div>

      {isOwner ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Admin Warnings</h4>
            {ownerWarnings.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">No admin warnings yet.</div>
            ) : (
              <div className={listClass}>
                {ownerWarnings.map((inquiry) => (
                  <InquiryCard
                    key={inquiry._id}
                    inquiry={inquiry}
                    isAdminWarning
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">My Inquiries</h4>
            {ownInquiries.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">No inquiries yet.</div>
            ) : (
              <div className={listClass}>
                {ownInquiries.map((inquiry) => (
                  <InquiryCard key={inquiry._id} inquiry={inquiry} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : ownInquiries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-700">No inquiries yet.</p>
          <p className="text-sm text-gray-500 mt-1">Use Add Inquiry to report an issue or request support.</p>
        </div>
      ) : (
        <div className={listClass}>
          {ownInquiries.map((inquiry) => (
            <InquiryCard key={inquiry._id} inquiry={inquiry} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <InquiryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        role={role}
        boardings={boardings}
        loadingBoardings={boardingsLoading}
      />
    </div>
  );
};

export default MyInquiries;
