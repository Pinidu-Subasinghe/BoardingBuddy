import React from 'react';

const RequestVisitModal = ({ open, onClose, boarding, user, onNotify }) => {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal – compact, no scroll, modern look */}
      <div className="
        relative bg-white rounded-xl shadow-2xl
        w-full max-w-md sm:max-w-lg
        p-5 sm:p-6
        border border-gray-100
      ">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Request Visit
          </h3>
          <button 
            onClick={onClose}
            className="
              p-1.5 rounded-lg text-gray-500 hover:text-gray-700 
              hover:bg-gray-100 transition-colors
            "
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content – same vertical stack, tighter spacing */}
        <div className="space-y-4 sm:space-y-5">
          {/* Boarding */}
          <div>
            <div className="inline-block text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-r-full">
              Boarding
            </div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">
              {boarding?.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {boarding?.address} — {boarding?.city}
            </div>
          </div>

          <hr className="border-black-200"></hr>

          {/* Owner */}
          <div>
            <div className="inline-block text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-r-full">
              Owner
            </div>
            <div className="font-medium text-gray-900 text-sm sm:text-base">
              {boarding?.owner?.name || 'Owner'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Contact: {boarding?.owner?.contactNumber || 'N/A'}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <button 
            onClick={onClose}
            className="
              w-full sm:w-auto px-5 py-2.5 
              border border-gray-300 rounded-lg 
              text-gray-700 text-sm sm:text-base font-medium
              hover:bg-gray-50 transition-colors duration-200
            "
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onNotify()}
            className="
              w-full sm:w-auto px-5 py-2.5 
              bg-indigo-600 text-white rounded-lg 
              text-sm sm:text-base font-medium
              hover:bg-indigo-700 transition-colors duration-200
            "
          >
            Notify Owner
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestVisitModal;