import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your PC's local IP when testing on a real device
export const API_BASE = 'http://192.168.100.7:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Inject citizen token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('citizen_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const citizenAuth = {
  register: (data) => api.post('/citizen/register/', data),
  login: (telephone, password) => api.post('/citizen/login/', { telephone, password }),
  logout: () => api.post('/citizen/logout/'),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileAPI = {
  get: () => api.get('/citizen/profile/'),
  update: (data) => api.patch('/citizen/profile/', data),
};

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const walletAPI = {
  balance: () => api.get('/citizen/wallet/'),
  recharge: (data) => api.post('/citizen/wallet/recharge/', data),
  pay: (data) => api.post('/citizen/wallet/pay/', data),
  transactions: () => api.get('/citizen/wallet/transactions/'),
};

// ─── History ──────────────────────────────────────────────────────────────────
export const historyAPI = {
  list: () => api.get('/citizen/history/'),
};

// ─── Lines & Buses ────────────────────────────────────────────────────────────
export const linesAPI = {
  list: () => api.get('/citizen/lines/'),
};

export const busesAPI = {
  live: () => api.get('/citizen/buses/live/'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifAPI = {
  list: () => api.get('/citizen/notifications/'),
};

// ─── Active Trip Tracking ─────────────────────────────────────────────────────
export const tripTrackingAPI = {
  activeTrip: () => api.get('/citizen/active-trip/'),
};

// ─── Ticket ───────────────────────────────────────────────────────────────────
export const ticketAPI = {
  get: (ticketId) => api.get(`/citizen/ticket/${ticketId}/`),
};

// ─── Ratings ──────────────────────────────────────────────────────────────────
export const ratingAPI = {
  submit: (data) => api.post('/citizen/rate-driver/', data),
};

// ─── Push Notifications ───────────────────────────────────────────────────────
export const pushAPI = {
  register: (token) => api.post('/citizen/push-token/', { token }),
};

export default api;
