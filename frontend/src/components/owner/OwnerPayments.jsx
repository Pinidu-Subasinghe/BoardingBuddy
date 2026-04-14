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

  const exportAsPDF = async () => {
    try {
      // robust dynamic imports that work with commonjs/esm shapes
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule && (autoTableModule.default || autoTableModule);

      const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const generatedAt = new Date();

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const marginLeft = 40;

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('Received Payments Report', marginLeft, 40);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated: ${formatDate(generatedAt)} ${generatedAt.toLocaleTimeString()}`, marginLeft, 60);

      const head = [['#', 'Student', 'Contact', 'Boarding', 'Payment Date', 'Method', 'Amount', 'Payment ID']];
      const body = payments.map((p, idx) => [
        String(idx + 1),
        p.student?.name || '—',
        p.student?.contactNumber || p.student?.email || '—',
        p.boarding?.title || '—',
        formatDate(p.paidAt || p.createdAt),
        p.method === 'bank_transfer' ? 'Bank Transfer' : 'Card',
        `LKR ${Number(p.amount || 0).toLocaleString()}`,
        p.transactionId || p._id,
      ]);

      if (typeof autoTable === 'function') {
        // jspdf-autotable v5 exports a function: autoTable(doc, { head, body, ... })
        autoTable(doc, {
          head,
          body,
          startY: 80,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          theme: 'striped',
          margin: { left: marginLeft, right: 40 },
          columnStyles: { 6: { halign: 'right' } },
        });
      } else if (typeof doc.autoTable === 'function') {
        // fallback for plugin attached to jsPDF prototype
        doc.autoTable({
          head,
          body,
          startY: 80,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          theme: 'striped',
          margin: { left: marginLeft, right: 40 },
          columnStyles: { 6: { halign: 'right' } },
        });
      } else {
        throw new Error('jspdf-autotable not found or incompatible');
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 80;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total: LKR ${Number(total).toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, finalY + 24, { align: 'right' });

      const filename = `received-payments-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating PDF download', err);
      alert('To enable direct PDF downloads, ensure `jspdf` and `jspdf-autotable` are installed: `npm install jspdf jspdf-autotable`');
    }
  };

  if (loading) return <LoadingAnimation text="Loading payments..." />;

  return (
    <div className="max-w-7xl mx-auto py-6 mt-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Received Payments</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">{payments.length} payments</div>
          <button
            onClick={exportAsPDF}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Export as PDF
          </button>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-600 font-semibold">LKR {Number(p.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {p.method === 'bank_transfer' && p.slipImageUrl ? (
                      <a href={p.slipImageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        View Slip
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
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
