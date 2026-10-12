import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { departmentService } from '../../services/departmentService';
import { useNotification } from '../../context/NotificationContext';
import { Play, AlertCircle, CheckCircle2 } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const RunPayrollModal = ({ onClose, onSuccess }) => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { success, error, warning } = useNotification();

  useEffect(() => {
    departmentService.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    }).catch(console.error);
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        month: Number(month),
        year: Number(year),
        department: department || undefined,
        notes: notes || undefined,
      };

      const res = await payrollService.processPayroll(payload);
      setResult(res);

      if (res.summary.totalCreated > 0) {
        success(`Successfully created ${res.summary.totalCreated} payroll drafts for ${res.summary.payPeriod}!`);
      } else if (res.summary.totalSkipped > 0) {
        warning(`Duplicate run prevented: All ${res.summary.totalSkipped} employees already have payroll for this period.`);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      error(`Error generating payroll: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom py-3 px-4">
            <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <Play size={18} className="text-primary" />
              <span>Run Monthly Payroll Wizard</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleRun}>
            <div className="modal-body p-4">
              <p className="text-muted small mb-3">
                Select the target period and department to generate payroll records. Forvex EMS will automatically calculate base earnings, allowances, tax slabs, loss of pay (LOP), and prevent duplicate runs.
              </p>

              <div className="row g-3 mb-3">
                <div className="col-7">
                  <label className="form-label small fw-bold text-secondary">Payroll Month</label>
                  <select
                    className="form-select form-select-sm"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    required
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-5">
                  <label className="form-label small fw-bold text-secondary">Year</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={2020}
                    max={2035}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Department (Optional)</label>
                <select
                  className="form-select form-select-sm"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Run Notes / Remarks</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Standard monthly salary run"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Execution Summary Feedback */}
              {result && (
                <div className="p-3 rounded border mt-3 bg-light">
                  <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                    {result.summary?.totalCreated > 0 ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <AlertCircle size={16} className="text-warning" />
                    )}
                    <span>Run Summary: {result.summary?.payPeriod}</span>
                  </h6>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Drafts Created:</span>
                    <strong className="text-success">{result.summary?.totalCreated}</strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Duplicates Prevented / Skipped:</span>
                    <strong className="text-warning">{result.summary?.totalSkipped}</strong>
                  </div>
                  {result.summary?.totalGross > 0 && (
                    <div className="d-flex justify-content-between small">
                      <span>Total Net Outlay:</span>
                      <strong>${result.summary?.totalNet?.toLocaleString()}</strong>
                    </div>
                  )}

                  {result.skipped?.length > 0 && (
                    <div className="mt-2 pt-2 border-top text-muted small" style={{ maxHeight: 100, overflowY: 'auto' }}>
                      <div className="fw-semibold text-secondary mb-1">Skipped Details:</div>
                      {result.skipped.map((s, idx) => (
                        <div key={idx}>• {s.name} ({s.employeeCode}): {s.reason}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer py-2 px-4">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                {result ? 'Done' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn btn-primary-nexus btn-sm"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Run Payroll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
