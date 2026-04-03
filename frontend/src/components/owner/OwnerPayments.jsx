import React, { useEffect, useState } from 'react';
import LoadingAnimation from '../LoadingAnimation';
import { getOwnerPayments } from '../../api/api';
import { formatDate } from '../../utils/date';

const OwnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await getOwnerPayments();
        setPayments(res.data || []);
      } catch (err) {
        console.error('Error fetching owner payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) return <LoadingAnimation text="Loading payments..." />;

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Received Payments</h3>
        <div className="text-sm text-gray-500">{payments.length} payments</div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">No payments received yet.</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boarding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.student?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.student?.contactNumber || p.student?.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.boarding?.title || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(p.paidAt || p.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-600 font-semibold">LKR {Number(p.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.transactionId || p._id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerPayments;
