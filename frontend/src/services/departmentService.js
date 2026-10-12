import api from './api';

export const departmentService = {
  getDepartments: async () => {
    const res = await api.get('/departments');
    return res.data;
  },

  createDepartment: async (data) => {
    const res = await api.post('/departments', data);
    return res.data;
  },

  updateDepartment: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },

  getDesignations: async (departmentId = null) => {
    const url = departmentId ? `/departments/designations/all?department=${departmentId}` : '/departments/designations/all';
    const res = await api.get(url);
    return res.data;
  },

  createDesignation: async (data) => {
    const res = await api.post('/departments/designations/all', data);
    return res.data;
  },
};
