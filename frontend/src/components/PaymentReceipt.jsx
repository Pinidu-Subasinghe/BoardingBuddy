import React from 'react';
import bbLogoNoBg from '../assets/bb_logo_no_bg.png';
import { formatDateTime } from '../utils/date';

const FALLBACK_VALUE = 'N/A';

const safeText = (value, fallback = FALLBACK_VALUE) => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const toMethodLabel = (method) => {
  const normalized = String(method || '').toLowerCase();
  return normalized === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment';
};

const toStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'succeeded' || normalized === 'success') return 'SUCCESS';
  if (normalized === 'pending') return 'PENDING';
  if (normalized === 'failed') return 'FAILED';
  return normalized ? normalized.toUpperCase() : 'SUCCESS';
};

const formatCurrency = (amount, currency = 'LKR') => {
  const numeric = Number(amount);
  const normalizedAmount = Number.isFinite(numeric) ? numeric : 0;
  return `${safeText(currency, 'LKR')} ${normalizedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const maskAccountNumber = (accountNumber) => {
  const digitsOnly = String(accountNumber || '').replace(/\D/g, '');
  if (!digitsOnly) return FALLBACK_VALUE;
  const last4 = digitsOnly.slice(-4).padStart(4, '*');
  return `*** ${last4}`;
};

const formatReceiptDateTime = (value) => {
  const formatted = formatDateTime(value);

  const date = new Date(value || Date.now());
  if (!Number.isNaN(date.getTime()) && formatted && formatted.trim()) {
    return formatted;
  }

  if (Number.isNaN(date.getTime())) return safeText(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const normalizeReceiptData = (receiptInput = {}) => {
  const statusLabel = toStatusLabel(receiptInput.status || 'succeeded');

  return {
    boardingName: safeText(receiptInput.boardingName, 'Boarding'),
    studentName: safeText(receiptInput.studentName, 'Student'),
    amountLabel: formatCurrency(receiptInput.amount, receiptInput.currency || 'LKR'),
    methodLabel: toMethodLabel(receiptInput.method),
    paymentId: safeText(receiptInput.paymentId),
    paidAtLabel: formatReceiptDateTime(receiptInput.paidAt || receiptInput.createdAt),
    statusLabel,
    statusClassName:
      statusLabel === 'SUCCESS'
        ? 'text-emerald-600'
        : statusLabel === 'PENDING'
          ? 'text-amber-600'
          : 'text-rose-600',
    payeeName: safeText(receiptInput.payeeName, 'Boarding Owner'),
    accountMasked: maskAccountNumber(receiptInput.accountNumber),
    bankName: safeText(receiptInput.bankName),
    branchName: safeText(receiptInput.branchName),
    bookingId: safeText(receiptInput.bookingId),
  };
};

const ReceiptItem = ({ label, value, valueClassName = 'text-slate-900' }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">{label}</p>
      <p className={`mt-1.5 break-words text-sm font-semibold sm:text-base ${valueClassName}`}>{value}</p>
    </div>
  );
};

const PaymentReceipt = ({ receipt }) => {
  const data = normalizeReceiptData(receipt);

  return (
    <article className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-cyan-900 px-5 pb-8 pt-8 sm:px-8">
        <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-indigo-200/20 blur-3xl" />

        <img
          src={bbLogoNoBg}
          alt="BoardingBuddy"
          className="mx-auto h-14 w-auto object-contain drop-shadow-[0_6px_12px_rgba(15,23,42,0.45)]"
        />

        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">
          BoardingBuddy Payment Receipt
        </p>

        <h2 className="mt-2 text-center text-xl font-black tracking-tight text-white sm:text-[1.7rem]">
          Payment for {data.boardingName}
        </h2>
      </div>

      <div className="space-y-5 bg-slate-50 px-4 py-6 sm:px-8 sm:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">Payment Information</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReceiptItem label="Student Name" value={data.studentName} />
            <ReceiptItem label="Payment Amount" value={data.amountLabel} />
            <ReceiptItem label="Method" value={data.methodLabel} />
            <ReceiptItem label="Payment ID" value={data.paymentId} />
            <ReceiptItem label="Date & Time" value={data.paidAtLabel} />
            <ReceiptItem label="Status" value={data.statusLabel} valueClassName={data.statusClassName} />
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-emerald-800">Payee Info</p>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Verified
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReceiptItem label="Payee Name" value={data.payeeName} />
            <ReceiptItem label="Account Number" value={data.accountMasked} />
            <ReceiptItem label="Bank" value={data.bankName} />
            <ReceiptItem label="Branch" value={data.branchName} />
            <ReceiptItem label="Boarding" value={data.boardingName} />
            <ReceiptItem label="Booking Reference" value={data.bookingId} />
          </div>
        </section>
      </div>
    </article>
  );
};

const loadImageAsDataUrl = (src) => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
};

const drawKeyValueField = ({ doc, label, value, x, y, maxWidth, valueColor = [15, 23, 42] }) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(label, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
  const lines = doc.splitTextToSize(String(value || FALLBACK_VALUE), maxWidth);
  doc.text(lines, x, y + 17);
};

export const buildPaymentReceiptFilename = (receiptInput = {}) => {
  const boardingChunk = safeText(receiptInput.boardingName, 'boarding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 36);

  const paymentChunk = safeText(receiptInput.paymentId, Date.now())
    .toString()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(-22);

  return `payment-receipt-${boardingChunk || 'boarding'}-${paymentChunk || Date.now()}.pdf`;
};

export const downloadPaymentReceiptPdf = async (receiptInput = {}) => {
  const receipt = normalizeReceiptData(receiptInput);
  const jspdfModule = await import('jspdf');
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, 24, contentWidth, 130, 16, 16, 'F');

  const logoDataUrl = await loadImageAsDataUrl(bbLogoNoBg);
  if (logoDataUrl) {
    const logoWidth = 92;
    const logoHeight = 46;
    doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - logoWidth / 2, 34, logoWidth, logoHeight);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text('BOARDINGBUDDY PAYMENT RECEIPT', pageWidth / 2, 102, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(`Payment for ${receipt.boardingName}`, contentWidth - 50);
  doc.text(titleLines, pageWidth / 2, 130, { align: 'center' });

  const paymentSectionY = 176;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, paymentSectionY, contentWidth, 214, 14, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Payment Information', margin + 18, paymentSectionY + 28);

  const leftX = margin + 18;
  const rightX = margin + contentWidth / 2 + 8;
  const columnWidth = contentWidth / 2 - 28;
  const rowStartY = paymentSectionY + 58;
  const rowGap = 54;

  drawKeyValueField({
    doc,
    label: 'STUDENT NAME',
    value: receipt.studentName,
    x: leftX,
    y: rowStartY,
    maxWidth: columnWidth,
  });
  drawKeyValueField({
    doc,
    label: 'PAYMENT AMOUNT',
    value: receipt.amountLabel,
    x: rightX,
    y: rowStartY,
    maxWidth: columnWidth,
  });

  drawKeyValueField({
    doc,
    label: 'PAYMENT METHOD',
    value: receipt.methodLabel,
    x: leftX,
    y: rowStartY + rowGap,
    maxWidth: columnWidth,
  });
  drawKeyValueField({
    doc,
    label: 'PAYMENT ID',
    value: receipt.paymentId,
    x: rightX,
    y: rowStartY + rowGap,
    maxWidth: columnWidth,
  });

  drawKeyValueField({
    doc,
    label: 'DATE & TIME',
    value: receipt.paidAtLabel,
    x: leftX,
    y: rowStartY + rowGap * 2,
    maxWidth: columnWidth,
  });
  drawKeyValueField({
    doc,
    label: 'STATUS',
    value: receipt.statusLabel,
    x: rightX,
    y: rowStartY + rowGap * 2,
    maxWidth: columnWidth,
    valueColor: receipt.statusLabel === 'SUCCESS' ? [22, 163, 74] : [220, 38, 38],
  });

  const payeeSectionY = paymentSectionY + 236;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, payeeSectionY, contentWidth, 176, 14, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(6, 95, 70);
  doc.text('Payee Information', margin + 18, payeeSectionY + 28);

  const payeeRowStartY = payeeSectionY + 58;
  const payeeRowGap = 47;

  drawKeyValueField({
    doc,
    label: 'PAYEE NAME',
    value: receipt.payeeName,
    x: leftX,
    y: payeeRowStartY,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });
  drawKeyValueField({
    doc,
    label: 'ACCOUNT NUMBER',
    value: receipt.accountMasked,
    x: rightX,
    y: payeeRowStartY,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });

  drawKeyValueField({
    doc,
    label: 'BANK',
    value: receipt.bankName,
    x: leftX,
    y: payeeRowStartY + payeeRowGap,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });
  drawKeyValueField({
    doc,
    label: 'BRANCH',
    value: receipt.branchName,
    x: rightX,
    y: payeeRowStartY + payeeRowGap,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });

  drawKeyValueField({
    doc,
    label: 'BOARDING',
    value: receipt.boardingName,
    x: leftX,
    y: payeeRowStartY + payeeRowGap * 2,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });
  drawKeyValueField({
    doc,
    label: 'BOOKING REFERENCE',
    value: receipt.bookingId,
    x: rightX,
    y: payeeRowStartY + payeeRowGap * 2,
    maxWidth: columnWidth,
    valueColor: [15, 23, 42],
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 54, pageWidth - margin, pageHeight - 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 34);
  doc.text('BoardingBuddy', pageWidth - margin, pageHeight - 34, { align: 'right' });

  doc.save(buildPaymentReceiptFilename(receiptInput));
};

export default PaymentReceipt;
