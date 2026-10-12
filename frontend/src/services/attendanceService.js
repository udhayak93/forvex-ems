import api from './api';

export const attendanceService = {
  getAttendance: async (params = {}) => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  recordAttendance: async (data) => {
    const res = await api.post('/attendance', data);
    return res.data;
  },

  getLeaves: async (params = {}) => {
    const res = await api.get('/attendance/leaves', { params });
    return res.data;
  },

  applyLeave: async (data) => {
    const res = await api.post('/attendance/leaves', data);
    return res.data;
  },

  reviewLeave: async (id, data) => {
    const res = await api.patch(`/attendance/leaves/${id}/review`, data);
    return res.data;
  },
};
