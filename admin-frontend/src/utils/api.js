import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne pas rediriger si c'est la requête login elle-même (mauvais mot de passe)
      const isLoginRequest = error.config?.url?.includes('/login/');
      if (!isLoginRequest) {
        // Token expiré ou invalide - vider et rediriger
        Cookies.remove('access_token');
        localStorage.removeItem('mauribus_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============= AUTH ENDPOINTS =============
export const authAPI = {
  login: (matricule, password) =>
    api.post('/login/', { matricule, password }),
  logout: () => api.post('/logout/'),
  refresh: (refreshToken) =>
    api.post('/auth/refresh/', { refresh: refreshToken }),
};

// ============= ADMIN ENDPOINTS =============
export const adminAPI = {
  list: (params) => api.get('/admins/', { params }),
  retrieve: (id) => api.get(`/admins/${id}/`),
  create: (data) => api.post('/admins/', data),
  update: (id, data) => api.patch(`/admins/${id}/`, data),
  delete: (id) => api.delete(`/admins/${id}/`),
  suspend: (id) => api.post(`/admins/${id}/suspend/`),
  activate: (id) => api.post(`/admins/${id}/activate/`),
};

// ============= DRIVER ENDPOINTS =============
export const driverAPI = {
  list: (params) => api.get('/drivers/', { params }),
  retrieve: (id) => api.get(`/drivers/${id}/`),
  create: (data) => api.post('/drivers/', data),
  update: (id, data) => api.patch(`/drivers/${id}/`, data),
  delete: (id) => api.delete(`/drivers/${id}/`),
  suspend: (id) => api.post(`/drivers/${id}/suspend/`),
};

// ============= BUS ENDPOINTS =============
export const busAPI = {
  list: (params) => api.get('/buses/', { params }),
  retrieve: (id) => api.get(`/buses/${id}/`),
  create: (data) => api.post('/buses/', data),
  update: (id, data) => api.patch(`/buses/${id}/`, data),
  delete: (id) => api.delete(`/buses/${id}/`),
};

// ============= LINE ENDPOINTS =============
export const lineAPI = {
  list: (params) => api.get('/lines/', { params }),
  retrieve: (id) => api.get(`/lines/${id}/`),
  create: (data) => api.post('/lines/', data),
  update: (id, data) => api.patch(`/lines/${id}/`, data),
  delete: (id) => api.delete(`/lines/${id}/`),
  stops: (lineId) => api.get(`/lines/${lineId}/stops/`),
  addBus: (lineId, busId) => api.post(`/lines/${lineId}/add_bus/`, { bus_id: busId }),
  removeBus: (lineId, busId) => api.post(`/lines/${lineId}/remove_bus/`, { bus_id: busId }),
};

// ============= TRIP ENDPOINTS =============
export const tripAPI = {
  list: (params) => api.get('/trips/', { params }),
  retrieve: (id) => api.get(`/trips/${id}/`),
  create: (data) => api.post('/trips/', data),
  update: (id, data) => api.patch(`/trips/${id}/`, data),
  delete: (id) => api.delete(`/trips/${id}/`),
  positions: (tripId) => api.get(`/trips/${tripId}/positions/`),
};

// ============= PAYMENT ENDPOINTS =============
export const paymentAPI = {
  list: (params) => api.get('/payments/', { params }),
  retrieve: (id) => api.get(`/payments/${id}/`),
  validate: (id) => api.post(`/payments/${id}/validate/`),
  reject: (id, data) => api.post(`/payments/${id}/reject/`, data),
};

// ============= REPORT ENDPOINTS =============
export const reportAPI = {
  list: (params) => api.get('/reports/', { params }),
  retrieve: (id) => api.get(`/reports/${id}/`),
  resolve: (id, data) => api.post(`/reports/${id}/resolve/`, data),
  reject: (id) => api.post(`/reports/${id}/reject/`),
  markRead: (id) => api.post(`/reports/${id}/mark_read/`),
  reply: (id, data) => api.post(`/reports/${id}/reply/`, data),
};

// ============= NOTIFICATION ENDPOINTS =============
export const notificationAPI = {
  list: (params) => api.get('/notifications/', { params }),
  create: (data) => api.post('/notifications/', data),
  delete: (id) => api.delete(`/notifications/${id}/`),
};

// ============= STATISTICS ENDPOINTS =============
export const statisticsAPI = {
  dashboard: () => api.get('/statistics/dashboard/'),
  revenue: (params) => api.get('/statistics/revenue/', { params }),
  drivers: () => api.get('/statistics/drivers/'),
  lines: () => api.get('/statistics/lines/'),
};

// ============= CITIZEN ENDPOINTS (admin) =============
export const citizenAdminAPI = {
  list: () => api.get('/admin/citizens/'),
  suspend: (id) => api.patch(`/admin/citizens/${id}/suspend/`),
  activate: (id) => api.patch(`/admin/citizens/${id}/activate/`),
};

// ============= WALLET ADMIN ENDPOINTS =============
export const walletAdminAPI = {
  recharges: (params) => api.get('/admin/wallet/recharges/', { params }),
  validate: (id) => api.patch(`/admin/wallet/validate/${id}/`, { action: 'VALIDE' }),
  refuse: (id, reason) => api.patch(`/admin/wallet/validate/${id}/`, { action: 'REFUSE', motif: reason }),
  financialStats: () => api.get('/admin/financial/stats/'),
  driverWallets: () => api.get('/admin/drivers/wallets/'),
  payDriver: (id, data) => api.post(`/admin/drivers/${id}/pay/`, data),
};

// ============= LIVE MAP ENDPOINT =============
export const liveMapAPI = {
  data: () => api.get('/admin/live-map/'),
};

// ============= EXTENDED NOTIFICATION =============
export const notifExtAPI = {
  send: (data) => api.post('/admin/notifications/send/', data),
};

// ============= APP WALLET (MauriBus) =============
export const appWalletAPI = {
  info: () => api.get('/admin/app-wallet/'),
  recharge: (data) => api.post('/admin/app-wallet/recharge/', data),
  driverPaymentsHistory: () => api.get('/admin/driver-payments/history/'),
};

// ============= SYSTEM ALERTS =============
export const systemAlertAPI = {
  list: (params) => api.get('/admin/system-alerts/', { params }),
  resolve: (id) => api.patch(`/admin/system-alerts/${id}/resolve/`),
};

// ============= DRIVER RATINGS =============
export const ratingAdminAPI = {
  list: (params) => api.get('/admin/driver-ratings/', { params }),
};
