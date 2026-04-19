import React, { useState } from 'react';
import AdminAddUserModal from './AdminAddUserModal';
import Swal from 'sweetalert2';

const AdminUserManagement = ({ users, currentUser, onCreate, onChangeRole, onDelete }) => {

  const [modalOpen, setModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(user => user.role === roleFilter);

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 sm:px-6 py-3">Name</th>
                <th className="px-4 sm:px-6 py-3">Email</th>
                <th className="px-4 sm:px-6 py-3">Role</th>
                <th className="px-4 sm:px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-6 py-12 text-center text-sm text-gray-500">
                    No users found matching the selected filter.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => {
                const roleColors = {
                  admin: 'bg-purple-100 text-purple-800',
                  inspector: 'bg-amber-100 text-amber-800',
                  owner: 'bg-emerald-100 text-emerald-800',
                  student: 'bg-indigo-100 text-indigo-800'
                };

                return (
                  <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">
                      {user.name || 'Unnamed'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        {currentUser && currentUser._id !== user._id && (
                          <>
                            <select
                              value={user.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                const result = await Swal.fire({
                                  title: 'Are you sure?',
                                  text: `Are you sure to change ${user.name || user.email} as a ${newRole}?`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#3085d6',
                                  cancelButtonColor: '#d33',
                                  confirmButtonText: 'Yes, change it!'
                                });
                                if (result.isConfirmed) {
                                  await onChangeRole(user._id, newRole);
                                  await Swal.fire({
                                    title: 'Changed!',
                                    text: `${user.name || user.email} is now a ${newRole}.`,
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
                                  await onDelete(user._id);
                                  await Swal.fire({
                                    title: 'Deleted!',
                                    text: 'User has been deleted.',
                                    icon: 'success'
                                  });
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                              aria-label="Delete user"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;