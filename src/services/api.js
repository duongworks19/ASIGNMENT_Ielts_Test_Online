import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999';
export const AUTH_TOKEN_STORAGE_KEY = 'ielts_auth_token';

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

export const storeToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

const api = (typeof axios.create === 'function' && axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})) || axios;

if (api.interceptors?.request && api.interceptors?.response) {
  api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const code = error.response?.data?.code;
      if (status === 401) {
        storeToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { code } }));
      } else if (status === 403 && ['ACCOUNT_LOCKED', 'ACCOUNT_BANNED', 'ACCOUNT_INACTIVE'].includes(code)) {
        storeToken(null);
        window.dispatchEvent(new CustomEvent('auth:account-blocked', { detail: { code } }));
      } else if (status === 403) {
        window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { code } }));
      }
      return Promise.reject(error);
    },
  );
}

export function getApiError(error, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  const response = error?.response?.data;
  const status = error?.response?.status;
  const message = response?.message
    || (status === 404
      ? 'Dịch vụ API không đúng hoặc chưa khởi động. Hãy chạy backend bằng "npm run server", không chạy raw JSON Server.'
      : null)
    || (!error?.response
      ? 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend đang chạy.'
      : fallback);
  const normalized = new Error(message);
  normalized.code = response?.code;
  normalized.status = status;
  normalized.errors = response?.errors || {};
  return normalized;
}

export default api;
