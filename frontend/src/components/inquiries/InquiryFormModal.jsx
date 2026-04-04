import React, { useEffect, useState } from 'react';

const InquiryFormModal = ({
  open,
  onClose,
  onSubmit,
  role,
  boardings,
  loadingBoardings,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [boardingId, setBoardingId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const needsCategory = role === 'student' || role === 'inspector';

  useEffect(() => {
    if (open) {
      setTitle('');
      setCategory('');
      setBoardingId('');
      setDescription('');
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (needsCategory && !category) nextErrors.category = 'Category is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category: needsCategory ? category : undefined,
      boardingId: needsCategory && boardingId ? boardingId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Add Inquiry</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter inquiry title"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {needsCategory && (
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Select category</option>
                <option value="Property Issue">Property Issue</option>
                <option value="System Issue">System Issue</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>
          )}

          {needsCategory && (
            <div>
              <label className="text-sm font-medium text-gray-700">Boarding (optional)</label>
              <select
                value={boardingId}
                onChange={(event) => setBoardingId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                disabled={loadingBoardings}
              >
                <option value="">Select boarding</option>
                {(boardings || []).map((boarding) => (
                  <option key={boarding._id} value={boarding._id}>
                    {boarding.title}
                  </option>
                ))}
              </select>
              {loadingBoardings && (
                <p className="mt-1 text-xs text-gray-500">Loading boardings...</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              rows={4}
              placeholder="Describe the issue"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-colors sm:w-auto"
            >
              Send to Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryFormModal;
