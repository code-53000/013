import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  },
);

export const apiClient = api;
export const API_BASE_URL = BASE_URL;

export const userApi = {
  login: (phone: string, name?: string) =>
    api.post('/users/login', { phone, name }).then((r) => r.data),
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/users', data).then((r) => r.data),
};

export const roomApi = {
  list: () => api.get('/rooms-and-equipment/rooms').then((r) => r.data),
  get: (id: string) => api.get(`/rooms-and-equipment/rooms/${id}`).then((r) => r.data),
  listEquipment: (roomId?: string) =>
    api.get('/rooms-and-equipment/equipment', { params: { roomId } }).then((r) => r.data),
  adminList: () => api.get('/admin/rooms').then((r) => r.data),
};

export const reservationApi = {
  list: (params?: any) =>
    api.get('/reservations', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/reservations/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/reservations', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/reservations/${id}`, data).then((r) => r.data),
  cancel: (id: string) => api.delete(`/reservations/${id}`).then((r) => r.data),
  getSlots: (roomId: string, equipmentId: string, date: string) =>
    api
      .get(`/reservations/rooms/${roomId}/equipment/${equipmentId}/slots`, {
        params: { date },
      })
      .then((r) => r.data),
};

export const trayApi = {
  list: (params?: any) => api.get('/trays', { params }).then((r) => r.data),
  getAvailable: (equipmentId?: string) =>
    api.get('/trays/available', { params: { equipmentId } }).then((r) => r.data),
  borrow: (data: any) => api.post('/trays/borrow', data).then((r) => r.data),
  return: (data: any) => api.post('/trays/return', data).then((r) => r.data),
  markLost: (id: string) => api.post(`/trays/borrow-records/${id}/lost`).then((r) => r.data),
  getUserBorrows: (userId: string, activeOnly = false) =>
    api.get(`/trays/borrow-records/user/${userId}`, { params: { activeOnly } }).then((r) => r.data),
  checkOverdue: () => api.post('/trays/borrow-records/overdue-check').then((r) => r.data),
};

export const cleaningApi = {
  submit: (data: any) => api.post('/cleaning-records/submit', data).then((r) => r.data),
  score: (data: any) => api.post('/cleaning-records/score', data).then((r) => r.data),
  getByReservation: (reservationId: string) =>
    api.get(`/cleaning-records/reservation/${reservationId}`).then((r) => r.data),
  getUserStats: (userId: string) =>
    api.get(`/cleaning-records/user/${userId}/stats`).then((r) => r.data),
  list: (params?: any) => api.get('/cleaning-records', { params }).then((r) => r.data),
};

export const adminApi = {
  confirmReservation: (id: string, data: any) =>
    api.post(`/admin/reservations/${id}/confirm`, data).then((r) => r.data),
  updateReservationStatus: (id: string, data: any) =>
    api.put(`/admin/reservations/${id}/status`, data).then((r) => r.data),
  createViolation: (data: any) => api.post('/admin/violations', data).then((r) => r.data),
  getViolations: (params?: any) =>
    api.get('/admin/violations', { params }).then((r) => r.data),
  resolveViolation: (id: string, data: any) =>
    api.put(`/admin/violations/${id}/resolve`, data).then((r) => r.data),
  getUsers: (role?: string) => api.get('/admin/users', { params: { role } }).then((r) => r.data),
  getStats: () => api.get('/admin/dashboard/stats').then((r) => r.data),
};
