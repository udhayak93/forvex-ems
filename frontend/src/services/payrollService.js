import api from './api';

export const payrollService = {
  getConfig: async () => {
    const res = await api.get('/payroll-config');
    return res.data;
  },

  updateConfig: async (data) => {
    const res = await api.put('/payroll-config', data);
    return res.data;
  },

  previewPayroll: async (data) => {
    const res = await api.post('/payroll/preview', data);
    return res.data;
  },

  processPayroll: async (data) => {
    const res = await api.post('/payroll/process', data);
    return res.data;
  },

  getPayrollRecords: async (params = {}) => {
    const res = await api.get('/payroll', { params });
    return res.data;
  },

  getPayrollRecordById: async (id) => {
    const res = await api.get(`/payroll/${id}`);
    return res.data;
  },

  updatePayrollRecord: async (id, data) => {
    const res = await api.put(`/payroll/${id}`, data);
    return res.data;
  },

  updatePayrollStatus: async (id, data) => {
    const res = await api.patch(`/payroll/${id}/status`, data);
    return res.data;
  },

  batchStatusUpdate: async (data) => {
    const res = await api.post('/payroll/batch-status', data);
    return res.data;
  },

  deletePayrollRecord: async (id) => {
    const res = await api.delete(`/payroll/${id}`);
    return res.data;
  },

  getMyPayslips: async () => {
    const res = await api.get('/payroll/my/payslips');
    return res.data;
  },
};
