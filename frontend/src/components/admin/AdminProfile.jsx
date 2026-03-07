import React from 'react';

const AdminProfile = ({ user }) => {
  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">My Profile</h3>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
    </div>
  );
};

export default AdminProfile;
