import React, { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const AdminBoardingManagement = ({ boardings, inspectors, onAssign, section = 'new' }) => {
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredBoardings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleBoardings;

    return visibleBoardings.filter((boarding) =>
      String(boarding?.title || '').toLowerCase().includes(query)
    );
  }, [visibleBoardings, searchQuery]);

  const emptyText = section === 'approved'
    ? 'No approved boardings yet.'
    : 'No new boardings yet.';

  const helperText = section === 'approved'
    ? 'Published boardings approved by admins appear here.'
    : 'Unpublished boardings pending publication will appear here.';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 shadow-sm">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Boarding Management</h3>
        <p className="mt-1 text-sm text-gray-600">
          {section === 'approved' ? 'Browse all approved boardings.' : 'Review new boardings and assign inspectors.'}
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-2xl">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Type boarding name..."
              className="h-11 w-full rounded-xl border border-indigo-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
            {`${filteredBoardings.length} of ${visibleBoardings.length} boardings`}
          </div>
        </div>
      </div>

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Boarding Name</th>
                  <th className="px-4 sm:px-6 py-3">Address</th>
                  <th className="px-4 sm:px-6 py-3">City</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Inspector</th>
                  {section === 'new' && <th className="px-4 sm:px-6 py-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBoardings.length === 0 ? (
                  <tr>
                    <td colSpan={section === 'new' ? 6 : 5} className="px-4 sm:px-6 py-12 text-center text-sm text-gray-500">
                      No matching boardings found. Try typing another boarding name.
                    </td>
                  </tr>
                ) : filteredBoardings.map((b) => {
                  const displayStatus = (() => {
                    if ((b.status === 'pending' || b.status === undefined) && b.assignedInspector) return 'Inspector Assigned';
                    if (b.status === 'pending' || b.status === undefined) return 'Pending';
                    if (b.status === 'inspector assigned') return 'Inspector Assigned';
                    if (b.status === 'approved') return 'Approved';
                    if (b.status === 'rejected') return 'Rejected';
                    return String(b.status || 'Pending').charAt(0).toUpperCase() + String(b.status || 'pending').slice(1);
                  })();

                  const inspectorName = inspectors.find((i) => i._id === b.assignedInspector)?.name || 'Not assigned';

                  return (
                    <tr key={b._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{b.title}</td>
                      <td className="px-4 sm:px-6 py-4">{b.address || '-'}</td>
                      <td className="px-4 sm:px-6 py-4">{b.city || '-'}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(b.status)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600">{inspectorName}</td>
                      {section === 'new' && (
                        <td className="px-4 sm:px-6 py-4">
                          {(b.status === 'pending' || b.status === undefined) ? (
                            <select
                              defaultValue={b.assignedInspector || ''}
                              onChange={(e) => onAssign(b._id, e.target.value)}
                              className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                              <option value="">Assign inspector...</option>
                              {inspectors.map((i) => (
                                <option key={i._id} value={i._id}>
                                  {i.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-500">No action</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBoardingManagement;