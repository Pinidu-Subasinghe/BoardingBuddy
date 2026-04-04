import React from 'react';
import { formatDate } from '../../utils/date';
import InquiryStatusBadge from './InquiryStatusBadge';

const InquiryCard = ({ inquiry, isAdminWarning, onDelete }) => {
  const warningMessage =
    inquiry.ownerWarningMessage || inquiry.penaltyNote || inquiry.adminResponse || '';

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {isAdminWarning ? (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              ⚠️ Admin Warning
            </span>
          ) : (
            <>
              <h4 className="font-semibold text-gray-900 tracking-tight">{inquiry.title}</h4>
              {inquiry.category && (
                <p className="text-xs text-gray-500 mt-1">
                  Category: <span className="font-medium text-gray-700">{inquiry.category}</span>
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isAdminWarning && <InquiryStatusBadge status={inquiry.status} />}
          <button
            type="button"
            onClick={() => onDelete?.(inquiry)}
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

      {!isAdminWarning && (
        <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">
          {inquiry.description}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Created: {formatDate(inquiry.createdAt)}
      </p>

      {!isAdminWarning && inquiry.adminResponse && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Admin Response
          </p>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
            {inquiry.adminResponse}
          </p>
        </div>
      )}

      {isAdminWarning && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Admin Warning
          </p>
          <p className="mt-2 text-sm text-red-700 whitespace-pre-line">
            {warningMessage || 'No warning message provided.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InquiryCard;
