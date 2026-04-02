import React, { useEffect, useMemo, useState } from 'react';
import { getMyPayments } from '../../api/api';
import { formatDateTime } from '../../utils/date';
import LoadingAnimation from '../LoadingAnimation';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchPayments = async () => {
      try {
        setError('');
        const res = await getMyPayments();
        const paymentList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.payments)
            ? res.data.payments
            : [];

        const sortedPayments = paymentList
          .slice()
          .sort(
            (a, b) =>
              new Date(b?.paidAt || b?.createdAt || 0).getTime() -
              new Date(a?.paidAt || a?.createdAt || 0).getTime()
          );

        if (isMounted) {
          setPayments(sortedPayments);
        }
      } catch (err) {
        if (isMounted) {
          setPayments([]);
          setError(err?.message || 'Unable to load payment records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const successfulPayments = payments.filter((payment) => payment?.status === 'succeeded');
    const totalAmount = successfulPayments.reduce((sum, payment) => sum + Number(payment?.amount || 0), 0);

    return {
      successfulCount: successfulPayments.length,
      totalAmount,
    };
  }, [payments]);

  if (loading) {
    return <LoadingAnimation text="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Payments</h3>
          <p className="text-sm text-gray-500 mt-1">Payment records for your boardings.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
            Successful: {summary.successfulCount}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            Total Paid: LKR {summary.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-lg text-gray-700 font-semibold">No payment records found.</p>
          <p className="text-sm text-gray-500 mt-2">Your successful and pending payment records will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Paid On</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Boarding</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Method</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Card</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Transaction ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((payment) => {
                  const status = String(payment?.status || '').toLowerCase();
                  const amount = Number(payment?.amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  const statusClass =
                    status === 'succeeded'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-red-100 text-red-700 border-red-200';

                  return (
                    <tr key={payment?._id || payment?.transactionId} className="hover:bg-gray-50/70">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                        {formatDateTime(payment?.paidAt || payment?.createdAt)}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-gray-700">
                        <p className="font-semibold text-gray-900">{payment?.boarding?.title || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {[payment?.boarding?.address, payment?.boarding?.city].filter(Boolean).join(' - ') || 'N/A'}
                        </p>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {payment?.currency || 'LKR'} {amount}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                          {status === 'succeeded' ? 'Succeeded' : 'Failed'}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 capitalize">
                        {payment?.method || 'card'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700">
                        {String(payment?.cardBrand || 'card').toUpperCase()} **** {payment?.cardLast4 || '----'}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                        {payment?.transactionId || 'N/A'}
                      </td>
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

export default StudentPayments;
