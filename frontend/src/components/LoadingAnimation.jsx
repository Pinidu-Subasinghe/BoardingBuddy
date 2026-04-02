import React from 'react';

const LoadingAnimation = ({ text = 'Loading...', containerClassName = 'min-h-[280px]' }) => {
  return (
    <div className={`${containerClassName} flex items-center justify-center`}>
      <div className="flex items-center gap-3 text-indigo-600 font-medium">
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        {text}
      </div>
    </div>
  );
};

export default LoadingAnimation;
