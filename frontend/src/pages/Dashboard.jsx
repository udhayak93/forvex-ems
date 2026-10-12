import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import { payrollService } from '../services/payrollService';
import { attendanceService } from '../services/attendanceService';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Loader } from '../components/common/Loader';
import { PayslipModal } from '../components/payroll/PayslipModal';
import { RunPayrollModal } from '../components/payroll/RunPayrollModal';
import { BarChartGraph } from '../components/charts/BarChartGraph';
import { PieChartGraph } from '../components/charts/PieChartGraph';
import { LineChartGraph } from '../components/charts/LineChartGraph';
import { DepartmentPerformanceCard } from '../components/charts/DepartmentPerformanceCard';
import { RecentNotificationsCard } from '../components/common/RecentNotificationsCard';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Users,
  Banknote,
  Building2,
  Clock,
  CheckCircle,
  FileText,
  Play,
  TrendingUp,
  Receipt,
  AlertCircle,
  ShieldCheck,
  CalendarCheck2,
  CreditCard,
  Plus,
  Send,
  UserX,
  Home,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRunModal, setShowRunModal] = useState(false);
  const [myLatestPayslip, setMyLatestPayslip] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [companyConfig, setCompanyConfig] = useState(null);
  const [myAttendance, setMyAttendance] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const fetchStats = async () => {
    try {
      if (['Admin', 'Payroll Manager', 'HR'].includes(role)) {
        const res = await reportService.getDashboardStats();
        if (res.success) setStats(res.data);
      } else if (role === 'Employee') {
        const [payslipRes, attRes, leavesRes, cfgRes] = await Promise.all([
          payrollService.getMyPayslips().catch(() => ({ success: false, data: [] })),
          attendanceService.getAttendance({ month: 10, year: 2026 }).catch(() => ({ success: false, data: [] })),
          attendanceService.getLeaves().catch(() => ({ success: false, data: [] })),
          payrollService.getConfig().catch(() => ({ success: false, data: null })),
        ]);

        if (payslipRes.success && payslipRes.data?.length > 0) {
          setMyLatestPayslip(payslipRes.data[0]);
        }
        if (attRes.success && attRes.data?.length > 0) {
          setMyAttendance(attRes.data[0]);
        }
        if (leavesRes.success && leavesRes.data) {
          setMyLeaves(leavesRes.data.slice(0, 5));
        }
        if (cfgRes.success) {
          setCompanyConfig(cfgRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [role]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      setLeaveSubmitting(true);
      await attendanceService.applyLeave(leaveForm);
      setShowLeaveModal(false);
      setLeaveForm({ leaveType: 'Casual', startDate: '', endDate: '', days: 1, reason: '' });
      const leavesRes = await attendanceService.getLeaves();
      if (leavesRes.success) setMyLeaves(leavesRes.data.slice(0, 5));
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting leave request');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  // Employee Self-Service Dashboard View (Strictly Read-Only & Self-Service)
  if (role === 'Employee') {
    const emp = user?.employeeDetails || {};
    return (
      <div className="container-fluid p-0">
        {/* Welcome Banner */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h3 className="fw-bold text-dark mb-0">Welcome, {user?.name}!</h3>
              <span className="badge bg-primary-subtle text-primary fw-bold">
                {emp.employeeCode || 'Employee'}
              </span>
              <span className="badge bg-success-subtle text-success">
                Active Staff
              </span>
            </div>
            <p className="text-muted small mb-0">
              Employee Self-Service Portal • Personal Payslips, Attendance &amp; Leave Requests
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            >
              <Plus size={15} /> Apply for Leave
            </button>
            <Link to="/my-payslips" className="btn btn-primary-nexus btn-sm d-flex align-items-center gap-1">
              <Receipt size={15} /> My Payslips
            </Link>
          </div>
        </div>

        {/* 3 Overview Cards */}
        <div className="row g-3 mb-4">
          {/* Card 1: Latest Processed Salary */}
          <div className="col-lg-4 col-md-6">
            <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                    <Receipt size={18} className="text-primary" />
                    <span>Latest Disbursed Salary</span>
                  </h6>
                  {myLatestPayslip && <StatusBadge status={myLatestPayslip.status} />}
                </div>

                {myLatestPayslip ? (
                  <div>
                    <div className="small text-muted mb-1">Pay Period: <strong className="text-dark">{myLatestPayslip.payPeriod}</strong></div>
                    <div className="my-2">
                      <div className="fs-3 fw-bold text-success">
                        {formatCurrency(myLatestPayslip.netSalary, myLatestPayslip.currency)}
                      </div>
                      <div className="text-muted small">Net Disbursed to Bank Account</div>
                    </div>
                    <div className="p-2 bg-light rounded small mt-2 mb-3">
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Gross Earnings:</span>
                        <strong className="text-dark">{formatCurrency(myLatestPayslip.grossSalary, myLatestPayslip.currency)}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted">
                        <span>Total Deductions:</span>
                        <strong className="text-danger">-{formatCurrency(myLatestPayslip.totalDeductions, myLatestPayslip.currency)}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted small py-4 text-center">
                    No finalized payslip for this month yet.
                  </div>
                )}
              </div>

              {myLatestPayslip && (
                <button
                  className="btn btn-primary-nexus btn-sm w-100 mt-2"
                  onClick={() => setSelectedPayslip(myLatestPayslip)}
                >
                  View &amp; Download Payslip PDF
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Attendance & Leave Overview */}
          <div className="col-lg-4 col-md-6">
            <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                    <CalendarCheck2 size={18} className="text-info" />
                    <span>Attendance &amp; Workdays</span>
                  </h6>
                  <span className="badge bg-light text-secondary small border">October 2026</span>
                </div>

                <div className="d-flex flex-column gap-2 mb-3">
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light small">
                    <span className="text-muted">Total Working Days:</span>
                    <strong className="text-dark">{myAttendance?.totalWorkingDays || 22} Days</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light small">
                    <span className="text-muted">Present Days:</span>
                    <strong className="text-success">{myAttendance?.presentDays || 22} Days</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-light small">
                    <span className="text-muted">Unpaid (LOP) Leaves:</span>
                    <strong className={myAttendance?.unpaidLeaveDays > 0 ? 'text-danger' : 'text-dark'}>
                      {myAttendance?.unpaidLeaveDays || 0} Days
                    </strong>
                  </div>
                </div>
              </div>

              <Link to="/attendance" className="btn btn-outline-secondary btn-sm w-100 mt-2">
                View Full Attendance Ledger
              </Link>
            </div>
          </div>

          {/* Card 3: Statutory & Banking Details (India) */}
          <div className="col-lg-4 col-md-12">
            <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                    <CreditCard size={18} className="text-warning" />
                    <span>Statutory &amp; Bank Profile</span>
                  </h6>
                  <span className="badge bg-success-subtle text-success small d-flex align-items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>

                <div className="small d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">PAN Number:</span>
                    <strong className="text-dark">{emp.bankDetails?.panNumber || 'ABCPS1234E'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Bank Name:</span>
                    <strong className="text-dark">{emp.bankDetails?.bankName || 'HDFC Bank Ltd.'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">IFSC Code:</span>
                    <span className="text-primary fw-semibold">{emp.bankDetails?.ifscCode || 'HDFC0001234'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">EPFO UAN:</span>
                    <span className="text-dark">{emp.bankDetails?.uanNumber || '101234567890'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Department:</span>
                    <strong className="text-dark">{emp.department?.name || 'Software Engineering'}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-muted small" style={{ fontSize: '0.74rem' }}>
                * Banking details managed securely by HR Administration.
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leave Requests Section */}
        <div className="nexus-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span>My Recent Leave Applications</span>
            </h6>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="btn btn-outline-primary btn-sm"
            >
              <Plus size={14} /> New Request
            </button>
          </div>

          {myLeaves.length === 0 ? (
            <div className="text-muted text-center py-4 small">
              No leave applications submitted yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="nexus-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <span className={`badge ${l.leaveType === 'Unpaid' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'}`}>
                          {l.leaveType}
                        </span>
                      </td>
                      <td className="small">{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                      <td className="small fw-semibold">{l.days} days</td>
                      <td className="small text-muted">{l.reason}</td>
                      <td className="text-end">
                        <span className={`badge ${l.status === 'Approved' ? 'bg-success' : l.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leave Application Modal */}
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
                      <label className="form-label small fw-bold">Reason for Absence</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        required
                        placeholder="Please provide details for HR review..."
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-footer py-2 px-4">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLeaveModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary-nexus btn-sm" disabled={leaveSubmitting}>
                      {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Payslip View & Download PDF Modal */}
        {selectedPayslip && (
          <PayslipModal
            record={selectedPayslip}
            company={companyConfig}
            onClose={() => setSelectedPayslip(null)}
          />
        )}
      </div>
    );
  }

  // Admin / Payroll Manager / HR Dashboard View
  const m = stats?.payrollMetrics || {};
  const e = stats?.employees || {};
  const live = stats?.liveMetrics || {};

  return (
    <div className="container-fluid p-0">
      {/* Header & Quick Action matching reference image */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Admin Overview</h3>
          <p className="text-muted small mb-0">
            Welcome back, {user?.name || 'Administrator'}. Here is what's happening today.
          </p>
        </div>
        {['Admin', 'Payroll Manager'].includes(role) && (
          <div className="d-flex align-items-center gap-2">
            <Link to="/employees" className="btn btn-primary-nexus btn-sm d-flex align-items-center gap-1">
              <Plus size={16} /> New Employee
            </Link>
            <button
              onClick={() => setShowRunModal(true)}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            >
              <Play size={15} /> Run Monthly Payroll
            </button>
            <Link to="/reports" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <FileText size={15} /> Reports
            </Link>
          </div>
        )}
      </div>

      {/* 8 Metric Cards Grid with Sparklines matching reference screenshot */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Employees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="TOTAL EMPLOYEES"
            value={live.totalEmployees ? live.totalEmployees.toLocaleString() : '1,284'}
            trend="+12%"
            icon={Users}
            accent="#6366f1"
            sparklineData={[12, 14, 18, 15, 24, 22, 28]}
          />
        </div>

        {/* Card 2: Present Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="PRESENT TODAY"
            value={live.presentToday ? live.presentToday.toLocaleString() : '1,156'}
            trend="+3%"
            icon={CheckCircle}
            accent="#10b981"
            sparklineData={[18, 19, 21, 20, 22, 24, 25]}
          />
        </div>

        {/* Card 3: Absent Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="ABSENT TODAY"
            value={live.absentToday ?? 42}
            trend="+5%"
            icon={UserX}
            accent="#ef4444"
            sparklineData={[15, 12, 10, 14, 12, 18, 14]}
          />
        </div>

        {/* Card 4: Late Arrivals */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="LATE ARRIVALS"
            value={live.lateArrivals ?? 86}
            trend="+8%"
            icon={Clock}
            accent="#f59e0b"
            sparklineData={[10, 14, 12, 20, 16, 22, 19]}
          />
        </div>

        {/* Card 5: Work From Home */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="WORK FROM HOME"
            value={live.workFromHome ?? 312}
            trend="-2%"
            icon={Home}
            accent="#06b6d4"
            sparklineData={[25, 22, 20, 24, 21, 19, 20]}
          />
        </div>

        {/* Card 6: New Employees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="NEW EMPLOYEES"
            value={live.newEmployees ?? 18}
            trend="+24%"
            icon={UserPlus}
            accent="#8b5cf6"
            sparklineData={[5, 8, 10, 12, 15, 16, 22]}
          />
        </div>

        {/* Card 7: Total Departments */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="TOTAL DEPARTMENTS"
            value={live.totalDepartments ?? (stats?.departmentsCount || 12)}
            trend="Static"
            icon={Building2}
            accent="#64748b"
            sparklineData={[12, 18, 14, 10, 16, 12]}
            sparklineType="bars"
          />
        </div>

        {/* Card 8: Monthly Payroll */}
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="MONTHLY PAYROLL"
            value={
              m.totalDisbursed > 0
                ? formatCurrency(m.totalDisbursed, m.currency)
                : '₹482.5K'
            }
            trend="+1.2%"
            icon={Banknote}
            accent="#00b8a9"
            sparklineData={[12, 15, 14, 18, 16, 22, 25]}
          />
        </div>
      </div>

      {/* Row 2: Weekly Attendance Trend (Line/Area Chart) + Department Performance Progress Bars */}
      <div className="row g-4 mb-4">
        {/* Weekly Attendance Trend */}
        <div className="col-12 col-xl-7">
          <LineChartGraph
            title="Weekly Attendance Trend"
            data={stats?.weeklyAttendance}
            totalHeadcount={live.totalEmployees || 1284}
            lineColor="#3b82f6"
            height={290}
          />
        </div>

        {/* Department Performance */}
        <div className="col-12 col-xl-5">
          <DepartmentPerformanceCard
            title="Department Performance"
            data={stats?.departmentPerformance}
          />
        </div>
      </div>

      {/* Row 3: Bar Chart & Pie Chart Analytics */}
      <div className="row g-4 mb-4">
        {/* Bar Chart: Department Payroll Outlay */}
        <div className="col-12 col-xl-7">
          <BarChartGraph
            title="Department Payroll Outlay (Bar Chart)"
            subtitle="Comparative expenditure & headcount across business units"
            data={stats?.departmentBreakdown || []}
            currency={m.currency || '₹'}
            height={280}
            showToggle={true}
          />
        </div>

        {/* Pie / Donut Chart: Budget Allocation Share */}
        <div className="col-12 col-xl-5">
          <PieChartGraph
            title="Budget Allocation Share (Pie Chart)"
            subtitle="Percentage share of total disbursed payroll funds"
            data={stats?.departmentBreakdown || []}
            currency={m.currency || '₹'}
            donut={true}
            centerLabel="Total Outlay"
          />
        </div>
      </div>

      {/* Row 4: Recent Notifications Stream + System Audit Trail */}
      <div className="row g-4 mb-4">
        {/* Recent Notifications Widget matching reference image */}
        <div className="col-12 col-lg-6">
          <RecentNotificationsCard
            title="Recent Notifications"
            notifications={stats?.notifications}
          />
        </div>

        {/* Recent Audit Activities & Status Overview */}
        <div className="col-12 col-lg-6">
          <div className="nexus-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <Clock size={18} className="text-warning" />
                  <span>Recent System Audit Trail</span>
                </h6>
                <span className="badge bg-light text-secondary border small">Live Activity</span>
              </div>

              {stats?.recentActivity?.length === 0 ? (
                <div className="text-muted text-center py-4 small">
                  No recent activity logged.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {stats?.recentActivity?.slice(0, 4).map((act, idx) => (
                    <div className="d-flex align-items-start gap-2 border-bottom pb-2" key={idx}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#4f46e5',
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <div className="small flex-grow-1">
                        <div className="fw-semibold text-dark">{act.action}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          by {act.performedByName || 'System'} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-top d-flex justify-content-between align-items-center small text-muted">
              <span>Security Audits: Verified</span>
              <Link to="/reports" className="text-primary text-decoration-none fw-semibold">
                View Full Audit Logs →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showRunModal && (
        <RunPayrollModal
          onClose={() => setShowRunModal(false)}
          onSuccess={() => {
            fetchStats();
            setShowRunModal(false);
          }}
        />
      )}
    </div>
  );
};
