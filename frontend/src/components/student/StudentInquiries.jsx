import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/inquiries/my');
        setInquiries(res.data || []);
      } catch (err) {
        console.error('Error fetching inquiries', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">My Inquiries</h3>
      {inquiries.length === 0 ? (
        <p>No inquiries yet.</p>
      ) : (
        <div className="space-y-3">
          {inquiries.map(i => (
            <div key={i._id} className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold">{i.subject}</h4>
              <p className="text-sm">{i.message}</p>
              <p className="text-sm text-gray-500">Status: {i.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentInquiries;
