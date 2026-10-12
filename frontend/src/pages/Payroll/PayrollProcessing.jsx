import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { payrollService } from '../../services/payrollService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Loader } from '../../components/common/Loader';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { RunPayrollModal } from '../../components/payroll/RunPayrollModal';
import { AuditHistoryModal } from '../../components/payroll/AuditHistoryModal';
import { EditDraftModal } from '../../components/payroll/EditDraftModal';
import { formatCurrency } from '../../utils/formatters';
import {
  Banknote,
  Play,
  CheckCircle2,
  Send,
  CreditCard,
  Eye,
  Edit2,
  Trash2,
  History,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

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

export const PayrollProcessing = () => {
  const { hasRole } = useAuth();
  const { success, error, info } = useNotification();

  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected records for batch operations
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showRunModal, setShowRunModal] = useState(false);
  const [activePayslip, setActivePayslip] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getPayrollRecords({
        month,
        year,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        search: search || undefined,
      });
      if (res.success) setRecords(res.data);
    } catch (err) {
      error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentService.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    }).catch(console.error);

    payrollService.getConfig().then((res) => {
      if (res.success) setCompanyDetails(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [month, year, statusFilter, departmentFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleOpenPayslip = async (recordId) => {
    try {
      const res = await payrollService.getPayrollRecordById(recordId);
      if (res.success) {
        setActivePayslip(res.data);
        if (res.company) setCompanyDetails(res.company);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch payslip');
    }
  };

  const handleStatusTransition = async (record, nextStatus) => {
    try {
      await payrollService.updatePayrollStatus(record._id, {
        status: nextStatus,
        notes: `Advanced to ${nextStatus}`,
      });

      if (nextStatus === 'Approved') {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
        success(`Payroll approved for ${record.employee?.firstName} ${record.employee?.lastName}!`);
      } else if (nextStatus === 'Paid') {
        success(`Marked as Paid with disbursement reference.`);
      } else {
        info(`Payroll transitioned to ${nextStatus}.`);
      }

      fetchRecords();
    } catch (err) {
      error(err.response?.data?.message || `Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft payroll record?')) return;
    try {
      await payrollService.deletePayrollRecord(id);
      success('Draft record removed.');
      fetchRecords();
    } catch (err) {
      error(err.response?.data?.message || 'Error deleting draft');
    }
  };

  const handleBatchStatus = async (targetStatus) => {
    if (selectedIds.length === 0) return;
    try {
      await payrollService.batchStatusUpdate({
        ids: selectedIds,
        targetStatus,
        notes: `Batch transitioned to ${targetStatus}`,
      });
      success(`Updated ${selectedIds.length} records to ${targetStatus}`);
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      error(err.response?.data?.message || 'Error in batch status update');
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(records.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRecord = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Status counters for current month
  const counts = {
    all: records.length,
    draft: records.filter((r) => r.status === 'Draft').length,
    underReview: records.filter((r) => r.status === 'Under Review').length,
    approved: records.filter((r) => r.status === 'Approved').length,
    paid: records.filter((r) => r.status === 'Paid').length,
  };
  const pendingCount = counts.draft + counts.underReview;

  const handleApproveAllPending = async () => {
    const pendingIds = records
      .filter((r) => r.status === 'Draft' || r.status === 'Under Review')
      .map((r) => r._id);
    if (pendingIds.length === 0) return;
    if (!window.confirm(`Directly approve all ${pendingIds.length} pending payroll records?`)) return;
    try {
      await payrollService.batchStatusUpdate({
        ids: pendingIds,
        targetStatus: 'Approved',
        notes: 'Batch approved all pending drafts and reviews',
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      success(`Successfully approved all ${pendingIds.length} payroll records!`);
      fetchRecords();
    } catch (err) {
      error(err.response?.data?.message || 'Error approving pending records');
    }
  };

  const totalNet = records.reduce((sum, r) => sum + (r.netSalary || 0), 0);

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Monthly Payroll Processing</h3>
          <p className="text-muted small mb-0">Phase 5: Automated calculations, review workflow, duplicate prevention, and PDF payslips</p>
        </div>
        {hasRole('Admin', 'Payroll Manager') && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {pendingCount > 0 && (
              <button
                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                onClick={handleApproveAllPending}
                title="Directly approve all drafts and records currently in review"
              >
                <CheckCircle2 size={16} /> Quick Approve All Pending ({pendingCount})
              </button>
            )}
            <button className="btn btn-primary-nexus btn-sm" onClick={() => setShowRunModal(true)}>
              <Play size={16} /> Run Monthly Payroll
            </button>
          </div>
        )}
      </div>

      {/* Control & Period Bar (Responsive Grid) */}
      <div className="nexus-card p-3 mb-4">
        <form onSubmit={handleSearch} className="row g-2 align-items-end">
          <div className="col-6 col-md-2">
            <label className="form-label small fw-bold text-secondary mb-1">Period Month</label>
            <select
              className="form-select form-select-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-bold text-secondary mb-1">Period Year</label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-secondary mb-1">Department</label>
            <select
              className="form-select form-select-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-secondary mb-1">Search Staff</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Name or employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-2 text-end">
            <button type="submit" className="btn btn-outline-primary btn-sm w-100">
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Batch Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div className="d-flex overflow-x-auto pb-1 gap-1 flex-nowrap align-items-center" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="btn-group btn-group-sm flex-nowrap" role="group">
            <button
              type="button"
              className={`btn text-nowrap ${statusFilter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('')}
            >
              All Records ({counts.all})
            </button>
            <button
              type="button"
              className={`btn text-nowrap ${statusFilter === 'Draft' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Draft')}
            >
              Draft ({counts.draft})
            </button>
            <button
              type="button"
              className={`btn text-nowrap ${statusFilter === 'Under Review' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Under Review')}
            >
              In Review ({counts.underReview})
            </button>
            <button
              type="button"
              className={`btn text-nowrap ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Approved')}
            >
              Approved ({counts.approved})
            </button>
            <button
              type="button"
              className={`btn text-nowrap ${statusFilter === 'Paid' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('Paid')}
            >
              Paid ({counts.paid})
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && hasRole('Admin', 'Payroll Manager') && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small text-muted">{selectedIds.length} selected:</span>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => handleBatchStatus('Approved')}
            >
              <CheckCircle2 size={14} className="me-1 d-inline" /> Approve Selected
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleBatchStatus('Paid')}
            >
              <CreditCard size={14} className="me-1 d-inline" /> Mark as Paid
            </button>
          </div>
        )}
      </div>

      {/* Payroll Records Table */}
      <div className="nexus-table-container">
        {loading ? (
          <Loader message="Loading monthly payroll ledger..." />
        ) : records.length === 0 ? (
          <div className="text-muted text-center py-5">
            <Banknote size={40} className="text-muted mb-2 d-block mx-auto opacity-50" />
            <p className="mb-2">No payroll records found for {MONTHS.find((m) => m.value === month)?.label} {year}.</p>
            {hasRole('Admin', 'Payroll Manager') && (
              <button className="btn btn-primary-nexus btn-sm" onClick={() => setShowRunModal(true)}>
                <Play size={14} /> Run Payroll for This Period
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nexus-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedIds.length === records.length && records.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Total Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.includes(r._id)}
                        onChange={() => toggleSelectRecord(r._id)}
                      />
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">
                        {r.employee?.firstName} {r.employee?.lastName}
                      </div>
                      <span className="badge bg-light text-secondary border small">
                        {r.employee?.employeeCode}
                      </span>
                    </td>
                    <td>
                      <div className="small fw-medium text-dark">{r.employee?.designation?.title || '—'}</div>
                      <span className="small text-muted">{r.employee?.department?.name || '—'}</span>
                    </td>
                    <td className="small text-secondary">
                      {formatCurrency(r.basicSalary, r.currency)}
                    </td>
                    <td>
                      <span className="fw-semibold text-success">
                        {formatCurrency(r.grossSalary, r.currency)}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-danger">
                        {formatCurrency(r.totalDeductions, r.currency)}
                      </span>
                      {r.lopDeduction > 0 && (
                        <span className="small text-danger d-block">
                          (incl. {formatCurrency(r.lopDeduction, r.currency)} LOP)
                        </span>
                      )}
                    </td>
                    <td>
                      <strong className="text-primary fs-6">
                        {formatCurrency(r.netSalary, r.currency)}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {/* View Payslip Modal */}
                        <button
                          className="btn btn-outline-primary"
                          title="View & Download Payslip"
                          onClick={() => handleOpenPayslip(r._id)}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Audit Trail Modal */}
                        <button
                          className="btn btn-outline-secondary"
                          title="View Audit History"
                          onClick={() => setHistoryRecord(r)}
                        >
                          <History size={14} />
                        </button>

                        {/* Status workflow buttons */}
                        {hasRole('Admin', 'Payroll Manager') && (
                          <>
                            {r.status === 'Draft' && (
                              <>
                                <button
                                  className="btn btn-outline-warning"
                                  title="Edit Draft Amounts"
                                  onClick={() => setEditingDraft(r)}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-outline-success"
                                  title="Direct Approve Payroll"
                                  onClick={() => handleStatusTransition(r, 'Approved')}
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  title="Delete Draft"
                                  onClick={() => handleDeleteDraft(r._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {r.status === 'Under Review' && (
                              <button
                                className="btn btn-outline-success"
                                title="Approve Payroll"
                                onClick={() => handleStatusTransition(r, 'Approved')}
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                            )}

                            {r.status === 'Approved' && (
                              <button
                                className="btn btn-outline-dark"
                                title="Mark as Disbursed/Paid"
                                onClick={() => handleStatusTransition(r, 'Paid')}
                              >
                                <CreditCard size={14} /> Disburse
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRunModal && (
        <RunPayrollModal
          onClose={() => setShowRunModal(false)}
          onSuccess={() => {
            fetchRecords();
            setShowRunModal(false);
          }}
        />
      )}

      {activePayslip && (
        <PayslipModal
          record={activePayslip}
          company={companyDetails}
          onClose={() => setActivePayslip(null)}
        />
      )}

      {historyRecord && (
        <AuditHistoryModal
          record={historyRecord}
          onClose={() => setHistoryRecord(null)}
        />
      )}

      {editingDraft && (
        <EditDraftModal
          record={editingDraft}
          onClose={() => setEditingDraft(null)}
          onUpdated={fetchRecords}
        />
      )}
    </div>
  );
};
