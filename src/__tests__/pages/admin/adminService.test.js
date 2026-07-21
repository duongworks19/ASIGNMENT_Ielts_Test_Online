import api from '../../../services/api';
import * as authService from '../../../services/authService';
import {
  createUser,
  deleteUser,
  getUsers,
  requireAdminAuth,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from '../../../services/adminService';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  getApiError: (error, fallback) => {
    const normalized = new Error(error?.response?.data?.message || fallback);
    normalized.code = error?.response?.data?.code;
    normalized.errors = error?.response?.data?.errors || {};
    return normalized;
  },
}));
jest.mock('../../../services/authService');

const admin = { id: 'u-admin-001', name: 'Admin', email: 'admin@test.com', role: 'admin' };

describe('adminService authorization and user endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(admin);
  });

  test('requireAdminAuth returns the current admin identity', () => {
    expect(requireAdminAuth()).toEqual({ adminId: admin.id, adminName: admin.name });
  });

  test.each([null, { id: 's1', role: 'student' }, { id: 't1', role: 'teacher' }])('rejects non-admin client session %#', (user) => {
    authService.getCurrentUser.mockReturnValue(user);
    expect(() => requireAdminAuth()).toThrow(user ? 'FORBIDDEN' : 'UNAUTHORIZED');
  });

  test('gets paginated users from protected admin endpoint', async () => {
    const payload = { data: [admin], total: 1, page: 1, totalPages: 1 };
    api.get.mockResolvedValue({ data: payload });
    await expect(getUsers({ page: 1 })).resolves.toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/admin/users', { params: { page: 1 } });
  });

  test('creates Student/Teacher through /admin/users', async () => {
    api.post.mockResolvedValue({ data: { user: { id: 'u-student-010', role: 'student' } } });
    await expect(createUser({ role: 'student' })).resolves.toMatchObject({ role: 'student' });
    expect(api.post).toHaveBeenCalledWith('/admin/users', { role: 'student' });
  });

  test('edits user through protected endpoint', async () => {
    api.patch.mockResolvedValue({ data: { user: { id: 'u-1', role: 'teacher' } } });
    await updateUser('u-1', { role: 'teacher' });
    expect(api.patch).toHaveBeenCalledWith('/admin/users/u-1', { role: 'teacher' });
  });

  test('role helper still requires admin before calling API', async () => {
    authService.getCurrentUser.mockReturnValue(null);
    await expect(updateUserRole('u-1', 'teacher')).rejects.toThrow('UNAUTHORIZED');
    expect(api.patch).not.toHaveBeenCalled();
  });

  test('updates status and optional lock expiry', async () => {
    api.patch.mockResolvedValue({ data: { user: { id: 'u-1', status: 'locked' } } });
    await updateUserStatus('u-1', 'locked', '2026-07-21T00:00:00.000Z');
    expect(api.patch).toHaveBeenCalledWith('/admin/users/u-1/status', { status: 'locked', lockedUntil: '2026-07-21T00:00:00.000Z' });
  });

  test('deletes only through protected admin endpoint', async () => {
    api.delete.mockResolvedValue({ data: { message: 'ok' } });
    await deleteUser('u-1');
    expect(api.delete).toHaveBeenCalledWith('/admin/users/u-1');
  });

  test('preserves server validation details', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Email đã tồn tại.', code: 'EMAIL_EXISTS', errors: { email: 'Email đã tồn tại.' } } } });
    await expect(createUser({})).rejects.toMatchObject({ message: 'Email đã tồn tại.', code: 'EMAIL_EXISTS', errors: { email: 'Email đã tồn tại.' } });
  });
});
