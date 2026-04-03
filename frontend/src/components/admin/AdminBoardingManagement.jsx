import React, { useMemo } from 'react';

const AdminBoardingManagement = ({ boardings, inspectors, onAssign, section = 'new' }) => {

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inspector assigned':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const approvedBoardings = useMemo(
    () => boardings.filter((b) => b.status === 'approved'),
    [boardings]
  );

  const newBoardings = useMemo(
    () => boardings.filter((b) => b.status !== 'approved'),
    [boardings]
  );

  const visibleBoardings = section === 'approved' ? approvedBoardings : newBoardings;

  const emptyText = section === 'approved'
    ? 'No approved boardings yet.'
    : 'No new boardings yet.';

  const helperText = section === 'approved'
    ? 'Published boardings approved by admins appear here.'
    : 'Unpublished boardings pending publication will appear here.';

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="
        text-2xl sm:text-3xl font-bold 
        text-gray-900 tracking-tight
      ">
        Boarding Management
      </h3>

      {visibleBoardings.length === 0 ? (
        <div className="
          bg-white rounded-xl shadow-sm border border-gray-200 
          p-8 sm:p-10 text-center
        ">
          <p className="text-lg text-gray-600 font-medium">
            {emptyText}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        </div>
      ) : (
        <div className="
          bg-white rounded-xl shadow-sm border border-gray-200 
          divide-y divide-gray-100 overflow-hidden
        ">
          {visibleBoardings.map(b => (
            <div 
              key={b._id}
              className="
                px-5 sm:px-6 py-4 sm:py-5
                flex flex-col sm:flex-row sm:items-center sm:justify-between
                gap-4 sm:gap-6
                hover:bg-gray-50/70 transition-colors duration-150
              "
            >
              {/* Left: Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <h4 className="
                  font-semibold text-base sm:text-lg 
                  text-gray-900 truncate
                ">
                  {b.title}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  {b.address} — {b.city}
                </p>
                <p className="text-sm">
                  Inspection Status: <span className={`px-2 py-1 text-sm font-medium rounded-full border ${getStatusColor(b.status)}`}>
                    {(() => {
                      if ((b.status === 'pending' || b.status === undefined) && b.assignedInspector) return 'Inspector Assigned';
                      if (b.status === 'pending' || b.status === undefined) return 'Pending';
                      if (b.status === 'inspector assigned') return 'Inspector Assigned';
                      if (b.status === 'approved') return 'Approved';
                      if (b.status === 'rejected') return 'Rejected';
                      return b.status.charAt(0).toUpperCase() + b.status.slice(1);
                    })()}
                  </span>
                </p>
              </div>

              {/* Right: Assign / Status */}
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                {section === 'new' && b.status === 'pending' ? (
                  <select 
                    defaultValue={b.assignedInspector || ''}
                    onChange={(e) => onAssign(b._id, e.target.value)}
                    className="
                      w-full sm:w-64 px-4 py-2.5 
                      border border-gray-300 rounded-lg 
                      text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      bg-white shadow-sm
                      transition-all duration-200
                    "
                  >
                    <option value="">Assign inspector...</option>
                    {inspectors.map(i => (
                      <option key={i._id} value={i._id}>
                        {i.name} 
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(b.status)}`}>
                    {(() => {
                      if (b.status === 'inspector assigned') return 'Inspector Assigned';
                      if (b.status === 'approved') return 'Published';
                      if (b.status === 'rejected') return 'Not Published';
                      return b.status.charAt(0).toUpperCase() + b.status.slice(1);
                    })()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBoardingManagement;