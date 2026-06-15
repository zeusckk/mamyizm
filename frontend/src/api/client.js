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

// API helpers
export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.post('/auth/change-password', data).then((r) => r.data),
};

export const fundsApi = {
  list: () => api.get('/funds').then((r) => r.data),
  get: (code) => api.get(`/funds/${code}`).then((r) => r.data),
};

export const portfolioApi = {
  get: () => api.get('/portfolio').then((r) => r.data),
};

export const tradeApi = {
  buy: (code, units) => api.post('/trade/buy', { code, units }).then((r) => r.data),
  sell: (code, units) => api.post('/trade/sell', { code, units }).then((r) => r.data),
};

export const cashApi = {
  deposit: (amount) => api.post('/cash/deposit', { amount }).then((r) => r.data),
  withdraw: (amount) => api.post('/cash/withdraw', { amount }).then((r) => r.data),
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

