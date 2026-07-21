import api, { getApiError, getStoredToken, storeToken } from './api';

const ROLE_DASHBOARD_PATHS = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/learning',
};

let currentUserSnapshot = null;

export function getCurrentUser() {
  return currentUserSnapshot;
}

export function setCurrentUserSnapshot(user) {
  currentUserSnapshot = user || null;
  window.dispatchEvent(new Event('auth:user-changed'));
  return currentUserSnapshot;
}

export function saveAuthUser(user) {
  return setCurrentUserSnapshot(user);
}

export function getAccessToken() {
  return getStoredToken();
}

export async function loginWithEmailAndPassword(email, password) {
  try {
    const response = await api.post('/auth/login', {
      email: String(email || '').trim().toLowerCase(),
      password,
    });
    storeToken(response.data.token);
    setCurrentUserSnapshot(response.data.user);
    return response.data.user;
  } catch (error) {
    throw getApiError(error, 'Đăng nhập thất bại.');
  }
}

export async function registerNewUser(userData) {
  try {
    const response = await api.post('/auth/register', {
      fullName: String(userData.fullName || userData.name || '').trim(),
      email: String(userData.email || '').trim().toLowerCase(),
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      dateOfBirth: userData.dateOfBirth || '',
    });
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Đăng ký thất bại.');
  }
}

export async function verifyEmailToken(token) {
  try {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Xác thực email thất bại.');
  }
}

export async function fetchCurrentUser() {
  try {
    const response = await api.get('/auth/me');
    return setCurrentUserSnapshot(response.data.user);
  } catch (error) {
    throw getApiError(error, 'Không thể khôi phục phiên đăng nhập.');
  }
}

export async function requestPasswordReset(email) {
  try {
    const response = await api.post('/auth/forgot-password', {
      email: String(email || '').trim().toLowerCase(),
    });
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Không thể tạo yêu cầu đặt lại mật khẩu.');
  }
}

export async function resetPassword(payload) {
  try {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Không thể đặt lại mật khẩu.');
  }
}

export async function changePassword(payload) {
  try {
    const response = await api.post('/auth/change-password', payload);
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Không thể đổi mật khẩu.');
  }
}

export function logout() {
  storeToken(null);
  setCurrentUserSnapshot(null);
}

export function getDashboardPathByRole(role) {
  return ROLE_DASHBOARD_PATHS[role] || '/403';
}

export function isRoleAllowed(user, allowedRoles = []) {
  return Boolean(user) && (allowedRoles.length === 0 || allowedRoles.includes(user.role));
}

export function isPathAllowedForRole(pathname, role) {
  if (!pathname || pathname === '/profile') return true;
  if (pathname.startsWith('/admin')) return role === 'admin';
  if (pathname.startsWith('/teacher')) return role === 'teacher';
  if (pathname.startsWith('/learning')) return role === 'student';
  return true;
}

// The previous fake Google login trusted a caller-provided role and created no
// verifiable identity. It is deliberately disabled until a real provider exists.
export async function loginWithGoogle() {
  throw new Error('Đăng nhập Google chưa được cấu hình trong bản demo FER202.');
}
