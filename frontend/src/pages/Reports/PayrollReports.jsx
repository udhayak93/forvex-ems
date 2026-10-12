import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { payrollService } from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarChart3, Download, History, FileSpreadsheet, CheckCircle, PieChart } from 'lucide-react';
import { BarChartGraph } from '../../components/charts/BarChartGraph';
import { PieChartGraph } from '../../components/charts/PieChartGraph';

export const PayrollReports = () => {
  const { hasRole } = useAuth();
  const { success, error } = useNotification();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'audit'
  const [summaryData, setSummaryData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, audRes] = await Promise.all([
        reportService.getPayrollSummary({ year }),
        reportService.getAuditLogs({ limit: 40 }),
      ]);
      if (sumRes.success) setSummaryData(sumRes.data);
      if (audRes.success) setAuditLogs(audRes.data);
    } catch (err) {
      error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  // Export Summary to CSV
  const handleExportCSV = () => {
    if (summaryData.length === 0) return;

    const headers = ['Pay Period', 'Total Employees', 'Gross Salary ($)', 'Total Deductions ($)', 'Net Disbursed ($)', 'Avg Net Salary ($)'];
    const rows = summaryData.map((s) => [
      s._id.payPeriod,
      s.totalRecords,
      s.totalGross,
      s.totalDeductions,
      s.totalNet,
      Math.round(s.avgNet * 100) / 100,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nexus_EMS_Payroll_Report_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Payroll report downloaded as CSV!');
  };

  if (loading) return <Loader message="Generating financial reports..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Financial & Payroll Reports</h3>
          <p className="text-muted small mb-0">Phase 5: Expenditure reconciliations, period-over-period trends, and compliance audit logs</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-primary-nexus btn-sm" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('summary')}
          >
            <BarChart3 size={16} className="me-1 d-inline" /> Monthly Expenditure Summary
          </button>
        </li>
        {hasRole('Admin') && (
          <li className="nav-item">
            <button
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('audit')}
            >
              <History size={16} className="me-1 d-inline" /> Enterprise Audit Logs
            </button>
          </li>
        )}
      </ul>

      {activeTab === 'summary' && (
        <div>
          <div className="nexus-card p-3 mb-4 d-flex align-items-center gap-3">
            <span className="small fw-bold text-secondary">Reporting Year:</span>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 120 }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          {/* Visual Charts Row */}
          {summaryData.length > 0 && (
            <div className="row g-4 mb-4">
              <div className="col-12 col-xl-7">
                <BarChartGraph
                  title={`Monthly Payroll Outlay (${year})`}
                  subtitle="Gross, Net & Headcount period trends"
                  data={summaryData.map((s) => ({
                    _id: s._id.payPeriod,
                    totalAmount: s.totalNet,
                    totalGross: s.totalGross,
                    totalDeductions: s.totalDeductions,
                    employeeCount: s.totalRecords,
                  }))}
                  height={270}
                  showToggle={true}
                />
              </div>
              <div className="col-12 col-xl-5">
                <PieChartGraph
                  title={`Period Outlay Distribution (${year})`}
                  subtitle="Share of annual payroll expenditure"
                  data={summaryData.map((s) => ({
                    _id: s._id.payPeriod,
                    totalAmount: s.totalNet,
                    employeeCount: s.totalRecords,
                  }))}
                  donut={true}
                  centerLabel="Annual Total"
                />
              </div>
            </div>
          )}

          <div className="nexus-table-container">
            {summaryData.length === 0 ? (
              <div className="text-muted text-center py-5">
                No payroll data recorded for year {year}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="nexus-table">
                  <thead>
                    <tr>
                      <th>Payroll Period</th>
                      <th>Processed Employees</th>
                      <th>Total Gross Outlay</th>
                      <th>Total Deductions & Tax</th>
                      <th>Net Disbursed Amount</th>
                      <th className="text-end">Avg Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong className="text-dark">{item._id.payPeriod}</strong>
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border">
                            {item.totalRecords} employees
                          </span>
                        </td>
                        <td className="fw-semibold text-success">
                          {formatCurrency(item.totalGross)}
                        </td>
                        <td className="fw-semibold text-danger">
                          {formatCurrency(item.totalDeductions)}
                        </td>
                        <td>
                          <strong className="text-primary fs-6">
                            {formatCurrency(item.totalNet)}
                          </strong>
                        </td>
                        <td className="text-end small fw-medium text-secondary">
                          {formatCurrency(item.avgNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="nexus-table-container">
          <div className="table-responsive">
            <table className="nexus-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Category</th>
                  <th>Performed By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="small text-muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark fw-bold border">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary small">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="fw-medium text-dark">
                      {log.performedByName || 'System'}
                    </td>
                    <td className="small text-muted font-monospace" style={{ maxWidth: 300 }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
