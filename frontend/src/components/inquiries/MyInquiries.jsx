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
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold">My Inquiries</h3>
        <div className="flex flex-wrap items-center gap-2">
          {isSelectableView && (
            <div className="flex items-center rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-semibold rounded-md ${
                  viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Inquiry
          </button>
        </div>
      </div>

      {isOwner ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Admin Warnings</h4>
            {ownerWarnings.length === 0 ? (
              <p>No admin warnings yet.</p>
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
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">My Inquiries</h4>
            {ownInquiries.length === 0 ? (
              <p>No inquiries yet.</p>
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
        <p>No inquiries yet.</p>
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
