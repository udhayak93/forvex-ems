import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Loader } from '../../components/common/Loader';
import { PayslipModal } from '../../components/payroll/PayslipModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Receipt, Eye, Download, ShieldCheck } from 'lucide-react';

export const MyPayslips = () => {
  const { user } = useAuth();
  const { error } = useNotification();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    Promise.all([
      payrollService.getMyPayslips(),
      payrollService.getConfig(),
    ]).then(([res, cfg]) => {
      if (res.success) setPayslips(res.data);
      if (cfg.success) setCompanyInfo(cfg.data);
    }).catch((err) => {
      error('Failed to load your personal payslips');
    }).finally(() => setLoading(false));
  }, []);

  const handleOpenPayslip = async (id) => {
    try {
      const res = await payrollService.getPayrollRecordById(id);
      if (res.success) {
        setSelectedRecord(res.data);
        if (res.company) setCompanyInfo(res.company);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Access Denied: Could not retrieve payslip.');
    }
  };

  if (loading) return <Loader message="Retrieving your verified payslips..." />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">My Digital Payslips</h3>
          <p className="text-muted small mb-0">Secure self-service access to your monthly salary statements & PDF downloads</p>
        </div>
        <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
          <ShieldCheck size={16} /> Confidential & Encrypted
        </div>
      </div>

      <div className="nexus-table-container">
        {payslips.length === 0 ? (
          <div className="text-muted text-center py-5">
            <Receipt size={40} className="text-muted mb-2 d-block mx-auto opacity-50" />
            <p className="mb-0">You have no finalized salary slips ready for download yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="nexus-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Working Days</th>
                  <th>Gross Salary</th>
                  <th>Total Deductions</th>
                  <th>Net Paid</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => (
                  <tr key={ps._id}>
                    <td>
                      <strong className="text-dark">{ps.payPeriod}</strong>
                      <span className="small text-muted d-block">{ps.paymentReference || 'Direct Deposit'}</span>
                    </td>
                    <td>{ps.workingDays} days</td>
                    <td className="text-success fw-semibold">
                      {formatCurrency(ps.grossSalary, ps.currency)}
                    </td>
                    <td className="text-danger fw-semibold">
                      {formatCurrency(ps.totalDeductions, ps.currency)}
                    </td>
                    <td>
                      <strong className="text-primary fs-6">
                        {formatCurrency(ps.netSalary, ps.currency)}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={ps.status} />
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-primary-nexus btn-sm"
                        onClick={() => handleOpenPayslip(ps._id)}
                      >
                        <Eye size={14} /> View & Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <PayslipModal
          record={selectedRecord}
          company={companyInfo}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
