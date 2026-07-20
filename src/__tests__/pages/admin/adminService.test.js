/**
 * adminService.test.js — Unit Tests cho T006: requireAdminAuth
 *
 * Traceability Matrix:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Test ID   │ EARS Ref         │ Scenario                                 │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ T006-01   │ State-driven     │ requireAdminAuth: pass khi role = admin   │
 * │ T006-02   │ Unwanted         │ requireAdminAuth: throw khi chưa đăng nhập│
 * │ T006-03   │ Unwanted         │ requireAdminAuth: throw khi role = student│
 * │ T006-04   │ Unwanted         │ requireAdminAuth: throw khi role = teacher│
 * │ T006-05   │ State-driven     │ updateUserRole: throw nếu không phải admin│
 * │ T006-06   │ State-driven     │ updateUserStatus: throw nếu không phải admin│
 * │ T006-07   │ State-driven     │ deleteUser: throw nếu không phải admin   │
 * │ T006-08   │ State-driven     │ updateCourse: throw nếu không phải admin │
 * │ T006-09   │ State-driven     │ approveRequest: throw nếu không phải admin│
 * │ T006-10   │ State-driven     │ rejectRequest: throw nếu không phải admin │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import { requireAdminAuth, updateUserRole, updateUserStatus, deleteUser, updateCourse, approveRequest, rejectRequest } from '../../../services/adminService';
import * as authService from '../../../services/authService';
import axios from 'axios';

// Mock axios và authService
jest.mock('axios');
jest.mock('../../../services/authService');

const mockAdminUser = { id: 'u-admin-001', name: 'System Admin', email: 'admin@test.com', role: 'admin' };
const mockStudentUser = { id: 'u-student-001', name: 'Student User', email: 'student@test.com', role: 'student' };
const mockTeacherUser = { id: 'u-teacher-001', name: 'Teacher User', email: 'teacher@test.com', role: 'teacher' };

describe('T006 — requireAdminAuth Guard', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T006-01: Admin hợp lệ → pass
  test('T006-01: Trả về adminId và adminName khi đăng nhập với role admin', () => {
    authService.getCurrentUser.mockReturnValue(mockAdminUser);

    const result = requireAdminAuth();

    expect(result).toEqual({
      adminId: 'u-admin-001',
      adminName: 'System Admin',
    });
  });

  // T006-02: Chưa đăng nhập → throw UNAUTHORIZED
  test('T006-02: Throw UNAUTHORIZED khi chưa có phiên đăng nhập (getCurrentUser = null)', () => {
    authService.getCurrentUser.mockReturnValue(null);

    expect(() => requireAdminAuth()).toThrow('UNAUTHORIZED');
    expect(() => requireAdminAuth()).toThrow('Phiên đăng nhập đã hết hạn');
  });

  // T006-03: Role student → throw FORBIDDEN
  test('T006-03: Throw FORBIDDEN khi role là "student"', () => {
    authService.getCurrentUser.mockReturnValue(mockStudentUser);

    expect(() => requireAdminAuth()).toThrow('FORBIDDEN');
    expect(() => requireAdminAuth()).toThrow('student');
  });

  // T006-04: Role teacher → throw FORBIDDEN
  test('T006-04: Throw FORBIDDEN khi role là "teacher"', () => {
    authService.getCurrentUser.mockReturnValue(mockTeacherUser);

    expect(() => requireAdminAuth()).toThrow('FORBIDDEN');
    expect(() => requireAdminAuth()).toThrow('teacher');
  });
});

describe('T006 — Mutate functions bị chặn khi không phải admin', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Mặc định: không có phiên đăng nhập
    authService.getCurrentUser.mockReturnValue(null);
  });

  // T006-05: updateUserRole bị chặn
  test('T006-05: updateUserRole throw nếu không có phiên admin', async () => {
    await expect(updateUserRole('u-001', 'teacher')).rejects.toThrow('UNAUTHORIZED');
    expect(axios.patch).not.toHaveBeenCalled();
  });

  // T006-06: updateUserStatus bị chặn
  test('T006-06: updateUserStatus throw nếu không có phiên admin', async () => {
    await expect(updateUserStatus('u-001', 'locked')).rejects.toThrow('UNAUTHORIZED');
    expect(axios.patch).not.toHaveBeenCalled();
  });

  // T006-07: deleteUser bị chặn
  test('T006-07: deleteUser throw nếu không có phiên admin', async () => {
    await expect(deleteUser('u-001')).rejects.toThrow('UNAUTHORIZED');
    expect(axios.delete).not.toHaveBeenCalled();
  });

  // T006-08: updateCourse bị chặn
  test('T006-08: updateCourse throw nếu không có phiên admin', async () => {
    await expect(updateCourse('course-001', { status: 'approved' })).rejects.toThrow('UNAUTHORIZED');
    expect(axios.patch).not.toHaveBeenCalled();
  });

  // T006-09: approveRequest bị chặn
  test('T006-09: approveRequest throw nếu không có phiên admin', async () => {
    await expect(approveRequest('req-001')).rejects.toThrow('UNAUTHORIZED');
    expect(axios.patch).not.toHaveBeenCalled();
  });

  // T006-10: rejectRequest bị chặn
  test('T006-10: rejectRequest throw nếu không có phiên admin', async () => {
    await expect(rejectRequest('req-001', 'Nội dung vi phạm')).rejects.toThrow('UNAUTHORIZED');
    expect(axios.patch).not.toHaveBeenCalled();
  });
});

describe('T006 — Mutate functions hoạt động bình thường khi là admin', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockAdminUser);
  });

  test('T006-A: updateUserRole gọi axios.patch khi admin đã xác thực', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'u-001', role: 'teacher' } });

    const result = await updateUserRole('u-001', 'teacher');

    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/users/u-001'),
      { role: 'teacher' }
    );
    expect(result).toEqual({ id: 'u-001', role: 'teacher' });
  });

  test('T006-B: approveRequest gọi axios.patch khi admin đã xác thực', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'req-001', status: 'approved' } });

    const result = await approveRequest('req-001');

    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/approvalRequests/req-001'),
      { status: 'approved' }
    );
    expect(result).toEqual({ id: 'req-001', status: 'approved' });
  });
});
