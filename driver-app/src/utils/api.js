import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚙️  Change this to your machine's local IP when testing on a real device
// For Android emulator: use 10.0.2.2 instead of localhost
// For physical device: use your computer's IP (ex: 192.168.1.50)
export const API_BASE = 'http://192.168.100.7:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Inject driver token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('driver_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const driverAuth = {
  login: (matricule, password) =>
    api.post('/driver-login/', { matricule, password }),
  logout: () => api.post('/driver-logout/'),
};

// ─── Trips ────────────────────────────────────────────────────────────────────
export const tripAPI = {
  list: () => api.get('/driver/trips/'),
  create: (data) => api.post('/driver/trips/create/', data),
  update: (id, data) => api.patch(`/driver/trips/${id}/update/`, data),
};

// ─── GPS ──────────────────────────────────────────────────────────────────────
export const gpsAPI = {
  post: (data) => api.post('/driver/gps/', data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportAPI = {
  create: (data) => api.post('/driver/reports/', data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  list: () => api.get('/driver/notifications/'),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  list: () => api.get('/driver/payments/'),
};

// ─── Ticket Validation ────────────────────────────────────────────────────────
export const ticketValidationAPI = {
  validate: (ticket_code) => api.post('/driver/validate-ticket/', { ticket_code }),
};

// ─── Stop Progression ────────────────────────────────────────────────────────
export const stopAPI = {
  getStops: (tripId) => api.get(`/driver/trips/${tripId}/stops/`),
  nextStop: (tripId) => api.post(`/driver/trips/${tripId}/next-stop/`),
};

// ─── Push Notifications ───────────────────────────────────────────────────────
export const pushAPI = {
  register: (token) => api.post('/driver/push-token/', { token }),
};

export default api;
