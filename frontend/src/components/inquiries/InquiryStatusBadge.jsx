import React from 'react';

const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  'In Review': 'bg-blue-100 text-blue-800 ring-blue-200',
  Resolved: 'bg-green-100 text-green-800 ring-green-200',
  Rejected: 'bg-red-100 text-red-800 ring-red-200',
};

const InquiryStatusBadge = ({ status }) => {
  const label = status || 'Pending';
  const style = STATUS_STYLES[label] || 'bg-gray-100 text-gray-700 ring-gray-200';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>
      {label}
    </span>
  );
};

export default InquiryStatusBadge;
