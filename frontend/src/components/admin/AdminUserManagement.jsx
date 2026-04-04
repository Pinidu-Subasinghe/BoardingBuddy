import React, { useState } from 'react';
import AdminAddUserModal from './AdminAddUserModal';
import Swal from 'sweetalert2';

const AdminUserManagement = ({ users, currentUser, onCreate, onChangeRole, onDelete }) => {
  const groupedUsers = {
    student: users.filter(u => u.role === 'student'),
    owner: users.filter(u => u.role === 'owner'),
    inspector: users.filter(u => u.role === 'inspector'),
    admin: users.filter(u => u.role === 'admin'),
  };

  const sections = [
    { role: 'admin', title: 'Administrators', color: 'purple' },
    { role: 'inspector', title: 'Inspectors', color: 'amber' },
    { role: 'owner', title: 'Boarding Owners', color: 'emerald' },
    { role: 'student', title: 'Students', color: 'indigo' },
  ];

  // ✅ Static Tailwind-safe color mapping
  const colorStyles = {
    purple: {
      header: 'bg-gradient-to-r from-purple-100/70 via-purple-50 to-transparent',
      title: 'text-purple-800',
      badge: 'bg-purple-100 text-purple-800 ring-purple-200',
      role: 'bg-purple-50 text-purple-700'
    },
    amber: {
      header: 'bg-gradient-to-r from-amber-100/70 via-amber-50 to-transparent',
      title: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800 ring-amber-200',
      role: 'bg-amber-50 text-amber-700'
    },
    emerald: {
      header: 'bg-gradient-to-r from-emerald-100/70 via-emerald-50 to-transparent',
      title: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      role: 'bg-emerald-50 text-emerald-700'
    },
    indigo: {
      header: 'bg-gradient-to-r from-indigo-100/70 via-indigo-50 to-transparent',
      title: 'text-indigo-800',
      badge: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
      role: 'bg-indigo-50 text-indigo-700'
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const visibleSections = roleFilter === 'all'
    ? sections
    : sections.filter(section => section.role === roleFilter);

  return (
    <div className="pt-4 sm:pt-6">
      <AdminAddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onCreate}
      />

      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-end">
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'inspector') && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create new user
          </button>
        )}

        <div className="sm:ml-auto">
          <label htmlFor="admin-user-role-filter" className="block text-sm font-medium text-gray-700">
            Filter users
          </label>
          <select
            id="admin-user-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="mt-1 h-11 px-3 py-2 border border-indigo-200 rounded-xl text-sm bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="all">All Users</option>
            <option value="student">Students</option>
            <option value="owner">Owners</option>
            <option value="inspector">Inspectors</option>
            <option value="admin">System Admins</option>
          </select>
        </div>
      </div>

      <div className="space-y-8 sm:space-y-10 lg:space-y-12">
        {visibleSections.map(({ role, title, color }) => {
          const roleUsers = groupedUsers[role];
          const styles = colorStyles[color];

          return (
            <div
              key={role}
              className="
                bg-white/80 backdrop-blur-md
                rounded-3xl
                shadow-sm hover:shadow-lg
                border border-gray-100
                transition-all duration-300
                overflow-hidden
              "
            >
              {/* Section Header */}
              <div
                className={`
                  px-5 sm:px-6 py-4 sm:py-5
                  border-b border-gray-100
                  ${styles.header}
                `}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`
                      text-lg sm:text-xl lg:text-2xl
                      font-semibold tracking-tight
                      ${styles.title}
                    `}
                  >
                    {title}
                  </h3>

                  <span
                    className={`
                      inline-flex items-center mt-1
                      text-xs font-semibold
                      px-3 py-1 rounded-full
                      ${styles.badge}
                      ring-1 shadow-sm
                    `}
                  >
                    {roleUsers.length}
                  </span>
                </div>
              </div>

              {/* Users List */}
              {roleUsers.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-400 italic">
                  No {title.toLowerCase()} found
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {roleUsers.map(u => (
                    <div
                      key={u._id}
                      className="
                        group
                        px-5 sm:px-6 py-4 sm:py-5
                        flex flex-col sm:flex-row sm:items-center sm:justify-between
                        gap-2 sm:gap-4
                        hover:bg-gray-50/70
                        transition-all duration-200
                      "
                    >
                      {/* User Info */}
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">{u.name || 'Unnamed'}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{u.email}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${styles.role}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </div>

                      <div className="mt-2 sm:mt-0 flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {currentUser && currentUser._id !== u._id && (
                          <>
                            <select
                              value={u.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const result = await Swal.fire({
                                  title: 'Are you sure?',
                                  text: `Are you sure to change ${u.name || u.email} as a ${newRole}?`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#3085d6',
                                  cancelButtonColor: '#d33',
                                  confirmButtonText: 'Yes, change it!'
                                });
                                if (result.isConfirmed) {
                                  await onChangeRole(u._id, newRole);
                                  await Swal.fire({
                                    title: 'Changed!',
                                    text: `${u.name || u.email} is now a ${newRole}.`,
                                    icon: 'success'
                                  });
                                }
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                              <option value="student">Student</option>
                              <option value="owner">Owner</option>
                              <option value="inspector">Inspector</option>
                              <option value="admin">Admin</option>
                            </select>

                            <button
                              onClick={async () => {
                                if (!onDelete) return;
                                const result = await Swal.fire({
                                  title: 'Are you sure?',
                                  text: `You won't be able to revert this!`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#3085d6',
                                  cancelButtonColor: '#d33',
                                  confirmButtonText: 'Yes, delete it!'
                                });
                                if (result.isConfirmed) {
                                  await onDelete(u._id);
                                  await Swal.fire({
                                    title: 'Deleted!',
                                    text: 'User has been deleted.',
                                    icon: 'success'
                                  });
                                }
                              }}
                              className="px-2.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                              aria-label="Delete user"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUserManagement;