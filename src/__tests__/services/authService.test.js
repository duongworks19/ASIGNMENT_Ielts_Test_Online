import api, { getStoredToken, storeToken } from '../../services/api';
import {
  fetchCurrentUser,
  getCurrentUser,
  getDashboardPathByRole,
  isPathAllowedForRole,
  loginWithEmailAndPassword,
  logout,
  registerNewUser,
  requestPasswordReset,
} from '../../services/authService';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  getStoredToken: jest.fn(),
  storeToken: jest.fn(),
  getApiError: (error, fallback) => {
    const normalized = new Error(error?.response?.data?.message || fallback);
    normalized.code = error?.response?.data?.code;
    normalized.status = error?.response?.status;
    normalized.errors = error?.response?.data?.errors || {};
    return normalized;
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logout();
    jest.clearAllMocks();
  });

  test('normalizes email, stores a real JWT response and exposes only sanitized user', async () => {
    const user = { id: 'u-1', email: 'student@example.com', role: 'student', status: 'active' };
    api.post.mockResolvedValue({ data: { token: 'header.payload.signature', user } });

    await expect(loginWithEmailAndPassword('  Student@Example.COM ', 'StrongPass1')).resolves.toEqual(user);

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'student@example.com',
      password: 'StrongPass1',
    });
    expect(storeToken).toHaveBeenCalledWith('header.payload.signature');
    expect(getCurrentUser()).toEqual(user);
    expect(getCurrentUser()).not.toHaveProperty('password');
    expect(getCurrentUser()).not.toHaveProperty('passwordHash');
  });

  test.each([
    [401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.'],
    [403, 'ACCOUNT_LOCKED', 'Tài khoản đang bị khóa.'],
    [403, 'ACCOUNT_BANNED', 'Tài khoản đã bị cấm.'],
  ])('preserves backend login error status and code (%s, %s)', async (status, code, message) => {
    api.post.mockRejectedValue({ response: { status, data: { code, message } } });

    await expect(loginWithEmailAndPassword('user@example.com', 'WrongPass1')).rejects.toMatchObject({
      message,
      code,
      status,
    });
    expect(storeToken).not.toHaveBeenCalled();
  });

  test('register sends only the public registration fields and never forwards role/status', async () => {
    const user = { id: 'u-student-2', role: 'student', status: 'active' };
    api.post.mockResolvedValue({ data: { user } });

    await registerNewUser({
      fullName: '  Nguyễn Văn An  ',
      email: ' AN@EXAMPLE.COM ',
      password: 'StrongPass1',
      confirmPassword: 'StrongPass1',
      dateOfBirth: '2000-02-29',
      role: 'admin',
      status: 'banned',
      passwordHash: 'forged',
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      fullName: 'Nguyễn Văn An',
      email: 'an@example.com',
      password: 'StrongPass1',
      confirmPassword: 'StrongPass1',
      dateOfBirth: '2000-02-29',
    });
  });

  test('restores current user from /auth/me and normalizes forgot-password email', async () => {
    const user = { id: 'u-2', role: 'teacher', status: 'active' };
    api.get.mockResolvedValue({ data: { user } });
    api.post.mockResolvedValue({ data: { message: 'Thông báo chung' } });

    await expect(fetchCurrentUser()).resolves.toEqual(user);
    await requestPasswordReset(' Teacher@Example.COM ');

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'teacher@example.com' });
  });

  test('logout removes token and invalid roles never fall back to Student', () => {
    getStoredToken.mockReturnValue('token');
    logout();
    expect(storeToken).toHaveBeenCalledWith(null);
    expect(getCurrentUser()).toBeNull();
    expect(getDashboardPathByRole('forged-admin')).toBe('/403');
    expect(isPathAllowedForRole('/admin/users', 'student')).toBe(false);
    expect(isPathAllowedForRole('/teacher/students', 'admin')).toBe(false);
    expect(isPathAllowedForRole('/profile', 'teacher')).toBe(true);
  });
});
