import api from './api';

export const employeeService = {
  getEmployees: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },

  getEmployeeById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (data) => {
    const res = await api.post('/employees', data);
    return res.data;
  },

  updateEmployee: async (id, data) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id, status) => {
    const res = await api.patch(`/employees/${id}/status`, { status });
    return res.data;
  },
};
