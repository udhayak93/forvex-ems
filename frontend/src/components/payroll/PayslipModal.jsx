import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Download, Printer, X, ShieldCheck } from 'lucide-react';
import '../../styles/payslip.css';

import { ForvexLogo } from '../common/ForvexLogo';

export const PayslipModal = ({ record, company, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef(null);

  if (!record) return null;

  const emp = record.employee || {};
  const currencySymbol = record.currency || company?.currency?.symbol || '₹';

  // High-Resolution PDF Download Generator
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      const fileName = `Payslip_${emp.employeeCode || 'EMP'}_${record.payPeriod?.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          {/* Modal Header */}
          <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <span>Official Indian Salary Slip</span>
              <span className="badge bg-primary text-uppercase" style={{ fontSize: '0.7rem' }}>
                {record.status}
              </span>
            </h5>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={handlePrint}
                title="Print Payslip"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={handleDownloadPDF}
                disabled={downloading}
                title="Download PDF"
              >
                <Download size={15} />
                <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                className="btn-close ms-2"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
          </div>

          {/* Modal Body: Printable Payslip Wrapper */}
          <div className="modal-body p-4 bg-light">
            <div className="payslip-wrapper shadow-sm" ref={printRef}>
              <div className="payslip-watermark">{record.status}</div>

              {/* Company Header with Forvex Logo */}
              <div className="payslip-header d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-center gap-3">
                  <ForvexLogo iconSize={34} textSize="1.5rem" variant="dark" />
                  <div className="border-start ps-3">
                    <div className="payslip-company-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {company?.name || 'Forvex Technologies India Pvt. Ltd.'}
                    </div>
                    <div className="payslip-company-meta">
                      {company?.address || 'Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103'}<br />
                      Email: {company?.email || 'payroll@forvex.in'} | Phone: {company?.phone || '+91 (080) 4123-4567'}<br />
                      <span className="text-muted fw-semibold">CIN: U72200KA2020PTC134567 | GSTIN: 29AABCN1234F1Z5</span>
                    </div>
                  </div>
                </div>
                <div className="payslip-badge-block">
                  <div className="payslip-title-tag">Payslip</div>
                  <div className="payslip-period-tag">{record.payPeriod}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Reference: {record.paymentReference || `NEFT-${record._id.substring(record._id.length - 8).toUpperCase()}`}
                  </div>
                </div>
              </div>

              {/* Employee and Statutory Details Grid */}
              <div className="payslip-grid">
                <div className="payslip-info-box">
                  <div className="payslip-row">
                    <span className="payslip-lbl">Employee ID:</span>
                    <span className="payslip-val">{emp.employeeCode || '—'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">Employee Name:</span>
                    <span className="payslip-val">{emp.firstName} {emp.lastName}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">Department:</span>
                    <span className="payslip-val">{emp.department?.name || '—'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">Designation:</span>
                    <span className="payslip-val">{emp.designation?.title || '—'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">Date of Joining:</span>
                    <span className="payslip-val">{formatDate(emp.dateOfJoining)}</span>
                  </div>
                </div>

                <div className="payslip-info-box">
                  <div className="payslip-row">
                    <span className="payslip-lbl">Bank Name:</span>
                    <span className="payslip-val">{emp.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">Account Number:</span>
                    <span className="payslip-val">{emp.bankDetails?.accountNumber || '••••••••1234'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">IFSC Code:</span>
                    <span className="payslip-val text-primary fw-bold">{emp.bankDetails?.ifscCode || 'HDFC0001234'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">PAN Number:</span>
                    <span className="payslip-val">{emp.bankDetails?.panNumber || emp.bankDetails?.taxId || 'ABCPS1234E'}</span>
                  </div>
                  <div className="payslip-row">
                    <span className="payslip-lbl">UAN (EPFO):</span>
                    <span className="payslip-val">{emp.bankDetails?.uanNumber || '101234567890'}</span>
                  </div>
                  <div className="payslip-row pt-1 border-top">
                    <span className="payslip-lbl">Working / Present Days:</span>
                    <span className="payslip-val">{record.workingDays} / {record.presentDays} days</span>
                  </div>
                  {record.unpaidLeaveDays > 0 && (
                    <div className="payslip-row">
                      <span className="payslip-lbl text-danger">Loss of Pay (LOP):</span>
                      <span className="payslip-val text-danger">{record.unpaidLeaveDays} days</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Split Breakdown Tables */}
              <div className="payslip-tables-split">
                {/* Earnings Table */}
                <div className="payslip-subtable">
                  <div className="payslip-subtable-head head-earnings">
                    <span>Earnings (INR)</span>
                    <span>Amount</span>
                  </div>
                  <div>
                    {record.earnings && record.earnings.map((item, idx) => (
                      <div className="payslip-subtable-row" key={idx}>
                        <span>{item.name}</span>
                        <span className="fw-semibold">{formatCurrency(item.amount, currencySymbol)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="payslip-subtable-foot text-success">
                    <span>Gross Earnings:</span>
                    <span>{formatCurrency(record.grossSalary, currencySymbol)}</span>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="payslip-subtable">
                  <div className="payslip-subtable-head head-deductions">
                    <span>Deductions & Statutory (INR)</span>
                    <span>Amount</span>
                  </div>
                  <div>
                    {record.deductions && record.deductions.map((item, idx) => (
                      <div className="payslip-subtable-row" key={idx}>
                        <span>{item.name}</span>
                        <span className="fw-semibold text-danger">
                          {formatCurrency(item.amount, currencySymbol)}
                        </span>
                      </div>
                    ))}
                    {record.lopDeduction > 0 && (
                      <div className="payslip-subtable-row">
                        <span className="text-danger">Loss of Pay (LOP Deduction)</span>
                        <span className="fw-semibold text-danger">
                          {formatCurrency(record.lopDeduction, currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="payslip-subtable-foot text-danger">
                    <span>Total Deductions:</span>
                    <span>{formatCurrency(record.totalDeductions, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Banner */}
              <div className="payslip-net-banner">
                <div>
                  <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em', opacity: 0.85 }}>
                    Net Salary Payable (Take Home)
                  </div>
                  <div className="net-amount-num">
                    {formatCurrency(record.netSalary, currencySymbol)}
                  </div>
                  <div className="net-amount-words">
                    {record.netSalaryInWords || 'Amount in words'}
                  </div>
                </div>
                <div className="text-end d-none d-sm-block">
                  <span className="badge bg-success py-2 px-3 fs-6 d-inline-flex align-items-center gap-1">
                    <ShieldCheck size={16} /> Disbursed via Bank Transfer
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="payslip-signature-grid">
                <div>
                  <div className="signature-line">
                    Employee Acknowledgment
                  </div>
                </div>
                <div>
                  <div className="signature-line">
                    Authorized Signatory (Finance & Compliance)
                  </div>
                </div>
              </div>

              <div className="text-center mt-4 text-muted" style={{ fontSize: '0.72rem' }}>
                This is a digitally generated payslip under the Payment of Wages Act. No physical signature is required.
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 px-4">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
