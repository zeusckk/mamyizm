import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

const TOKEN_KEY = 'fonakis_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); };

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      if (!window.location.pathname.startsWith('/giris') && !window.location.pathname.startsWith('/kayit')) {
        window.location.href = '/giris';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.post('/auth/change-password', data).then((r) => r.data),
};

export const kycApi = {
  submit: (data) => api.post('/kyc/submit', data).then((r) => r.data),
  status: () => api.get('/kyc/status').then((r) => r.data),
  demoApprove: () => api.post('/kyc/demo-approve').then((r) => r.data),
};

export const portfolioApi = {
  get: () => api.get('/portfolio').then((r) => r.data),
};

export const tradeApi = {
  buy: (symbol, units) => api.post('/trade/buy', { symbol, units }).then((r) => r.data),
  sell: (symbol, units) => api.post('/trade/sell', { symbol, units }).then((r) => r.data),
};

export const cashApi = {
  deposit: (data) => api.post('/cash/deposit', data).then((r) => r.data),
  withdraw: (amount) => api.post('/cash/withdraw', { amount }).then((r) => r.data),
};

export const paymentMethodsApi = {
  listActive: () => api.get('/payment-methods').then((r) => r.data),
};

export const depositRequestsApi = {
  myList: (status) => api.get('/deposit-requests', { params: { status } }).then((r) => r.data),
};

export const txApi = {
  list: (params = {}) => api.get('/transactions', { params }).then((r) => r.data),
};

export const marketApi = {
  group: (group) => api.get(`/market/${group}`).then((r) => r.data),
  symbolDetail: (symbol) => api.get('/market-symbol/detail', { params: { symbol } }).then((r) => r.data),
};

export const newsApi = {
  list: () => api.get('/news').then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  // Users
  listUsers: (params = {}) => api.get('/admin/users', { params }).then((r) => r.data),
  userDetail: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  // KYC
  kycPending: () => api.get('/admin/kyc/pending').then((r) => r.data),
  kycAll: (status) => api.get('/admin/kyc/all', { params: { status } }).then((r) => r.data),
  kycDocs: (userId) => api.get(`/admin/kyc/${userId}/documents`).then((r) => r.data),
  kycApprove: (userId) => api.post(`/admin/kyc/${userId}/approve`).then((r) => r.data),
  kycReject: (userId, reason) => api.post(`/admin/kyc/${userId}/reject`, { reason }).then((r) => r.data),
  // Transactions
  transactions: (params = {}) => api.get('/admin/transactions', { params }).then((r) => r.data),
  // News
  listNews: () => api.get('/admin/news').then((r) => r.data),
  createNews: (data) => api.post('/admin/news', data).then((r) => r.data),
  updateNews: (id, data) => api.patch(`/admin/news/${id}`, data).then((r) => r.data),
  deleteNews: (id) => api.delete(`/admin/news/${id}`).then((r) => r.data),
  // Reports
  topStocks: () => api.get('/admin/reports/top-stocks').then((r) => r.data),
  topUsers: () => api.get('/admin/reports/top-users').then((r) => r.data),
  holdingsDist: () => api.get('/admin/reports/holdings-distribution').then((r) => r.data),
  // Admins
  admins: () => api.get('/admin/admins').then((r) => r.data),
  createAdmin: (data) => api.post('/admin/admins', data).then((r) => r.data),
  // Settings
  settings: () => api.get('/admin/settings').then((r) => r.data),
  updateSettings: (data) => api.patch('/admin/settings', data).then((r) => r.data),
  // Audit log
  auditLog: (params = {}) => api.get('/admin/audit-log', { params }).then((r) => r.data),
  // Payment methods
  listPaymentMethods: (params = {}) => api.get('/admin/payment-methods', { params }).then((r) => r.data),
  createPaymentMethod: (data) => api.post('/admin/payment-methods', data).then((r) => r.data),
  updatePaymentMethod: (id, data) => api.patch(`/admin/payment-methods/${id}`, data).then((r) => r.data),
  deletePaymentMethod: (id) => api.delete(`/admin/payment-methods/${id}`).then((r) => r.data),
  // Deposit requests
  listDepositRequests: (params = {}) => api.get('/admin/deposit-requests', { params }).then((r) => r.data),
  depositRequestDetail: (id) => api.get(`/admin/deposit-requests/${id}`).then((r) => r.data),
  approveDepositRequest: (id) => api.post(`/admin/deposit-requests/${id}/approve`).then((r) => r.data),
  rejectDepositRequest: (id, reason) => api.post(`/admin/deposit-requests/${id}/reject`, { reason }).then((r) => r.data),
};
