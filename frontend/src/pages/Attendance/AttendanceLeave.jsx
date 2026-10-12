import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';
import {
  CalendarCheck2,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
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

export const AttendanceLeave = () => {
  const { user, hasRole, role } = useAuth();
  const { success, error } = useNotification();

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves'
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [attendanceList, setAttendanceList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, leaveRes] = await Promise.all([
        attendanceService.getAttendance({ month, year }),
        attendanceService.getLeaves(),
      ]);
      if (attRes.success) setAttendanceList(attRes.data);
      if (leaveRes.success) setLeavesList(leaveRes.data);
    } catch (err) {
      error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.applyLeave(leaveForm);
      success('Leave application submitted successfully!');
      setShowLeaveModal(false);
      setLeaveForm({ leaveType: 'Casual', startDate: '', endDate: '', days: 1, reason: '' });
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Error submitting leave');
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await attendanceService.reviewLeave(id, { status, reviewNotes: `Marked as ${status}` });
      success(`Leave application ${status}!`);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Error updating leave');
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            {role === 'Employee' ? 'My Attendance & Leave Records' : 'Attendance & Leave Records'}
          </h3>
          <p className="text-muted small mb-0">
            {role === 'Employee'
              ? 'View your verified monthly attendance summary and submit leave applications'
              : 'Track monthly workdays, overtime hours, and approve or reject leave requests'}
          </p>
        </div>
        <button
          className="btn btn-primary-nexus btn-sm d-flex align-items-center gap-1"
          onClick={() => setShowLeaveModal(true)}
        >
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      {/* Nav Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('attendance')}
          >
            <CalendarCheck2 size={16} className="me-1 d-inline" />
            {role === 'Employee' ? 'My Attendance Ledger' : 'Monthly Attendance Ledger'}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'leaves' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('leaves')}
          >
            <Clock size={16} className="me-1 d-inline" />
            {role === 'Employee' ? `My Leave Requests (${leavesList.length})` : `Leave Requests (${leavesList.length})`}
          </button>
        </li>
      </ul>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div>
          {/* Month/Year selector */}
          <div className="nexus-card p-3 mb-4 d-flex flex-wrap align-items-center gap-2">
            <span className="small fw-bold text-secondary me-1">Filter Period:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 160 }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 100 }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div className="nexus-table-container">
            {loading ? (
              <Loader message="Loading attendance ledger..." />
            ) : attendanceList.length === 0 ? (
              <div className="text-muted text-center py-5">
                No attendance records found for this period. Standard 22 working days will be assumed during payroll generation.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="nexus-table">
                  <thead>
                    <tr>
                      {role !== 'Employee' && <th>Employee</th>}
                      <th>Total Working Days</th>
                      <th>Present Days</th>
                      <th>Unpaid Leave (LOP)</th>
                      <th>Overtime Hours</th>
                      <th>Schedule Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((item) => (
                      <tr key={item._id}>
                        {role !== 'Employee' && (
                          <td>
                            <strong>{item.employee?.firstName} {item.employee?.lastName}</strong>
                            <span className="small text-muted d-block">{item.employee?.employeeCode}</span>
                          </td>
                        )}
                        <td>{item.totalWorkingDays} days</td>
                        <td>
                          <span className="badge bg-success-subtle text-success">
                            {item.presentDays} days
                          </span>
                        </td>
                        <td>
                          {item.unpaidLeaveDays > 0 ? (
                            <span className="badge bg-danger-subtle text-danger fw-bold">
                              {item.unpaidLeaveDays} days LOP
                            </span>
                          ) : (
                            <span className="text-muted">0 days</span>
                          )}
                        </td>
                        <td>
                          {item.overtimeHours > 0 ? (
                            <span className="badge bg-primary-subtle text-primary">
                              {item.overtimeHours} hrs
                            </span>
                          ) : (
                            <span className="text-muted">0 hrs</span>
                          )}
                        </td>
                        <td className="small text-muted">{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="nexus-table-container">
          {loading ? (
            <Loader message="Loading leave requests..." />
          ) : leavesList.length === 0 ? (
            <div className="text-muted text-center py-5">
              No leave applications submitted.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="nexus-table">
                <thead>
                  <tr>
                    {role !== 'Employee' && <th>Applicant</th>}
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {hasRole('Admin', 'HR') && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leavesList.map((l) => (
                    <tr key={l._id}>
                      {role !== 'Employee' && (
                        <td>
                          <strong>{l.employee?.firstName} {l.employee?.lastName}</strong>
                          <span className="small text-muted d-block">{l.employee?.employeeCode}</span>
                        </td>
                      )}
                      <td>
                        <span className={`badge ${l.leaveType === 'Unpaid' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'}`}>
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="small">
                        {formatDate(l.startDate)} - {formatDate(l.endDate)}
                      </td>
                      <td>{l.days} days</td>
                      <td className="small text-muted">{l.reason}</td>
                      <td>
                        <span className={`badge ${l.status === 'Approved' ? 'bg-success' : l.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {l.status}
                        </span>
                      </td>
                      {hasRole('Admin', 'HR') && (
                        <td className="text-end">
                          {l.status === 'Pending' && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                title="Approve"
                                onClick={() => handleReviewLeave(l._id, 'Approved')}
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Reject"
                                onClick={() => handleReviewLeave(l._id, 'Rejected')}
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark mb-0">Apply for Leave</h5>
                <button type="button" className="btn-close" onClick={() => setShowLeaveModal(false)} />
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Leave Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    >
                      <option value="Casual">Casual Leave (Paid)</option>
                      <option value="Sick">Sick Leave (Paid)</option>
                      <option value="Annual">Annual Vacation (Paid)</option>
                      <option value="Unpaid">Unpaid Leave (Loss of Pay)</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Start Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">End Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Total Days</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="form-control form-control-sm"
                      required
                      value={leaveForm.days}
                      onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Reason</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      required
                      placeholder="Please specify reason for absence..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLeaveModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-nexus btn-sm">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
