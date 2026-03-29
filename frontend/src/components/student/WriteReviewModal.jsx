import React, { useEffect, useState } from 'react';

const StarRating = ({ value, onChange, max = 5 }) => (
  <div className="flex flex-row gap-1">
    {[...Array(max)].map((_, i) => (
      <button
        key={i}
        type="button"
        className={
          'text-3xl transition-all duration-200 active:scale-90 hover:scale-125 focus:outline-none ' +
          (i < value ? 'text-amber-400 drop-shadow-sm' : 'text-zinc-300')
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

const createEmptyRatings = () => PREDEFINED_TAGS.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {});

const getRatingsState = (sourceRatings) => {
  const initialState = createEmptyRatings();
  if (!Array.isArray(sourceRatings)) return initialState;

  sourceRatings.forEach((item) => {
    if (!item || typeof item.tag !== 'string') return;
    const matchedTag = PREDEFINED_TAGS.find(tag => tag === item.tag.trim());
    const score = Number(item.score);
    if (matchedTag && Number.isFinite(score) && score >= 1 && score <= 5) {
      initialState[matchedTag] = score;
    }
  });

  return initialState;
};

const WriteReviewModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  mode = 'create',
  initialRatings = null,
  initialComment = ''
}) => {
  const [ratings, setRatings] = useState(getRatingsState(initialRatings));
  const [comment, setComment] = useState(initialComment || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setRatings(getRatingsState(initialRatings));
    setComment(initialComment || '');
    setErrors({});
  }, [open, initialRatings, initialComment]);

  const resetForm = () => {
    setRatings(createEmptyRatings());
    setComment('');
    setErrors({});
  };

  const validateRatings = (nextRatings) => {
    const unratedTags = PREDEFINED_TAGS.filter(tag => Number(nextRatings[tag]) <= 0);
    return unratedTags.length > 0 ? 'Please rate all categories.' : '';
  };

  const validateComment = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Comment is required.';
    if (trimmed.length > 150) return 'Comment must be 150 characters or fewer.';
    return '';
  };

  const handleRatingChange = (tag, value) => {
    setRatings(r => {
      const nextRatings = { ...r, [tag]: value };
      const ratingError = validateRatings(nextRatings);
      setErrors(prev => ({ ...prev, ratings: ratingError }));
      return nextRatings;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    const unratedTags = PREDEFINED_TAGS.filter(tag => Number(ratings[tag]) <= 0);
    if (unratedTags.length > 0) {
      nextErrors.ratings = 'Please rate all categories.';
    }
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      nextErrors.comment = 'Comment is required.';
    } else if (trimmedComment.length > 150) {
      nextErrors.comment = 'Comment must be 150 characters or fewer.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      ratings: Object.entries(ratings)
        .filter(([_, score]) => score > 0)
        .map(([tag, score]) => ({ tag, score })),
      comment: trimmedComment
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-auto">
        <button
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 text-3xl leading-none transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h4 className="text-xl font-semibold text-zinc-900 mb-6">
          {mode === 'edit' ? 'Edit Review' : 'Write a Review'}
        </h4>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-zinc-700 mb-3 text-base">Rate the following</label>
            <div className="space-y-4">
              {PREDEFINED_TAGS.map(tag => (
                <div key={tag} className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-zinc-700 text-sm font-medium leading-tight">
                    {tag}
                  </span>
                  <div className="flex justify-end">
                    <StarRating value={ratings[tag]} onChange={v => handleRatingChange(tag, v)} />
                  </div>
                </div>
              ))}
            </div>
            {errors.ratings && (
              <div className="mt-2 text-red-600 text-sm font-medium flex items-center gap-1">
                {errors.ratings}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-2 text-base">
              Comment
            </label>
            <textarea
              className="w-full border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-2xl px-4 py-3 text-sm min-h-[120px] resize-y transition-all"
              maxLength={150}
              value={comment}
              onChange={e => {
                const nextValue = e.target.value;
                setComment(nextValue);
                const commentError = validateComment(nextValue);
                setErrors(prev => ({ ...prev, comment: commentError }));
              }}
              placeholder="Share your experience..."
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-zinc-400">{comment.length}/150</span>
              {(comment.length >= 150 || errors.comment) && (
                <span className="text-red-500 font-medium">
                  {comment.length >= 150 ? 'Character limit reached' : errors.comment}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-6 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-700 font-medium transition-all disabled:opacity-50"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.985] text-white font-semibold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>{mode === 'edit' ? 'Saving...' : 'Posting...'}</>
              ) : (
                <>{mode === 'edit' ? 'Save Changes' : 'Post Review'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;