import React, { useState } from 'react';

const StarRating = ({ value, onChange, max = 5 }) => (
  <div className="flex flex-row gap-1">
    {[...Array(max)].map((_, i) => (
      <button
        key={i}
        type="button"
        className={
          'text-2xl focus:outline-none ' +
          (i < value ? 'text-yellow-400' : 'text-gray-300')
        }
        onClick={() => onChange(i + 1)}
        aria-label={`Rate ${i + 1} star${i === 0 ? '' : 's'}`}
      >
        ★
      </button>
    ))}
  </div>
);


const PREDEFINED_TAGS = [
  'Cleanliness',
  'Safety',
  'Facilities',
  'Owner Responsiveness'
];

const WriteReviewModal = ({ open, onClose, onSubmit, loading }) => {
  const [ratings, setRatings] = useState(
    PREDEFINED_TAGS.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {})
  );
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleRatingChange = (tag, value) => {
    setRatings(r => ({ ...r, [tag]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // At least one tag must be rated
    if (!Object.values(ratings).some(v => v > 0)) {
      setError('Please rate at least one tag.');
      return;
    }
    onSubmit({
      ratings: Object.entries(ratings)
        .filter(([_, score]) => score > 0)
        .map(([tag, score]) => ({ tag, score })),
      comment
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h4 className="text-lg font-bold mb-4">Write a Review</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Rate the following</label>
            <div className="space-y-3">
              {PREDEFINED_TAGS.map(tag => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="w-40 text-gray-700 text-sm">{tag}</span>
                  <StarRating value={ratings[tag]} onChange={v => handleRatingChange(tag, v)} />
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-2">Comment (optional)</label>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[60px]"
              maxLength={500}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
            />
          </div>
          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              onClick={onClose}
              disabled={loading}
            >Cancel</button>
            <button
              type="submit"
              className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              disabled={loading}
            >{loading ? 'Posting...' : 'Post Review'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
