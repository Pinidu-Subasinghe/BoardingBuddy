import React from 'react';

const OwnerBoardingCard = ({ boarding }) => {
  // Determine status color class
  let statusCls = '';
  let statusText = boarding.status || 'Pending';

  if (boarding.status === 'pending' || boarding.status === undefined) {
    if (boarding.assignedInspector) {
      statusCls = 'bg-orange-100 text-orange-800 border-orange-200';
      statusText = 'Awaiting Review';
    } else {
      statusCls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      statusText = 'Pending Assignment';
    }
  } else if (boarding.status === 'approved' || boarding.status === 'public' || boarding.status === 'inspected') {
    statusCls = 'bg-green-100 text-green-800 border-green-200';
    statusText = 'Approved & Published';
  } else if (boarding.status === 'rejected') {
    statusCls = 'bg-rose-100 text-rose-800 border-rose-200';
    statusText = 'Rejected';
  } else {
    statusCls = 'bg-gray-100 text-gray-700 border-gray-200';
  }

  return (
    <div 
      className="
        bg-white rounded-xl shadow-sm border border-gray-200 
        p-5 sm:p-6 hover:shadow-md hover:border-gray-300 
        transition-all duration-200
      "
    >
      <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 truncate">
        {boarding.title}
      </h4>

      <p className="text-sm text-gray-600 mb-2 truncate">
        {boarding.address} — {boarding.city}
      </p>

      <div className="text-sm space-y-1.5">
        <p>
          Rent: <span className="font-medium text-indigo-600">
            LKR {boarding.monthlyRent?.toLocaleString() || '—'}
          </span> / month
        </p>
        <p>
          Capacity: <span className="font-medium">{boarding.totalCapacity || '—'}</span>
        </p>
        <p className="truncate">
          Lifestyle: <span className="italic text-gray-700">
            {boarding.lifestyleTags?.join(', ') || 'None'}
          </span>
        </p>
        <p className="pt-2">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${statusCls}`}>
            {statusText}
          </span>
        </p>
      </div>
    </div>
  );
};

export default OwnerBoardingCard;
