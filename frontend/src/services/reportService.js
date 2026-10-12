import api from './api';

export const reportService = {
  getDashboardStats: async () => {
    const res = await api.get('/reports/dashboard-stats');
    return res.data;
  },

  getPayrollSummary: async (params = {}) => {
    const res = await api.get('/reports/payroll-summary', { params });
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/reports/audit-logs', { params });
    return res.data;
  },
};
