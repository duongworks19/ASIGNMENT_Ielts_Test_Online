import api, { getApiError } from './api';
import { getCurrentUser } from './authService';

export function requireAdminAuth() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Phiên đăng nhập đã hết hạn.');
  }
  if (user.role !== 'admin') {
    throw new Error(`FORBIDDEN: Role ${user.role} không có quyền Admin.`);
  }
  return { adminId: user.id, adminName: user.name || user.fullName || user.email };
}

export const getUsers = async (params) => (await api.get('/admin/users', { params })).data;

export const getUserById = async (userId) => (await api.get(`/admin/users/${userId}`)).data.user;

export const createUser = async (data) => {
  try {
    return (await api.post('/admin/users', data)).data.user;
  } catch (error) {
    throw getApiError(error, 'Không thể tạo tài khoản.');
  }
};

export const updateUser = async (userId, data) => {
  try {
    return (await api.patch(`/admin/users/${userId}`, data)).data.user;
  } catch (error) {
    throw getApiError(error, 'Không thể cập nhật tài khoản.');
  }
};

export const getUserSummaries = async () => (await api.get('/admin/users/summary')).data.data;

export const getDashboardSummary = async () => {
  try {
    return (await api.get('/admin/dashboard/summary')).data.data;
  } catch (error) {
    throw getApiError(error, 'Không thể tải dữ liệu tổng quan quản trị.');
  }
};

export const updateUserRole = async (userId, newRole) => {
  requireAdminAuth();
  return updateUser(userId, { role: newRole });
};

export const updateUserStatus = async (userId, newStatus, lockedUntil = null) => {
  requireAdminAuth();
  const payload = { status: newStatus };
  if (lockedUntil !== null) payload.lockedUntil = lockedUntil;
  try {
    return (await api.patch(`/admin/users/${userId}/status`, payload)).data.user;
  } catch (error) {
    throw getApiError(error, 'Không thể cập nhật trạng thái tài khoản.');
  }
};

export const deleteUser = async (userId) => {
  requireAdminAuth();
  try {
    return (await api.delete(`/admin/users/${userId}`)).data;
  } catch (error) {
    throw getApiError(error, 'Không thể xóa tài khoản.');
  }
};

export const getCourses = async (params) => {
  try {
    const response = await api.get('/courses', { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateCourse = async (courseId, data) => {
  requireAdminAuth();
  const response = await api.patch(`/courses/${courseId}`, data);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  requireAdminAuth();
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

export const getLessons = async (params) => {
  try {
    const response = await api.get('/lessons', { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateLesson = async (lessonId, data) => {
  requireAdminAuth();
  const response = await api.patch(`/lessons/${lessonId}`, data);
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  requireAdminAuth();
  const response = await api.delete(`/lessons/${lessonId}`);
  return response.data;
};

export const getTests = async (params) => {
  try {
    const response = await api.get('/tests', { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateTest = async (testId, data) => {
  requireAdminAuth();
  const response = await api.patch(`/tests/${testId}`, data);
  return response.data;
};

export const deleteTest = async (testId) => {
  requireAdminAuth();
  const response = await api.delete(`/tests/${testId}`);
  return response.data;
};

export const getApprovalRequests = async (params) => {
  try {
    const response = await api.get('/approvalRequests', { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

const patchTargetStatus = async (targetType, targetId, status) => {
  if (!targetType || !targetId) return;
  const collection = `${targetType}s`;
  await api.patch(`/${collection}/${targetId}`, {
    status,
    updatedAt: new Date().toISOString(),
  });
};

export const approveRequest = async (requestId, targetType, targetId, adminId) => {
  const admin = requireAdminAuth();
  const current = await api.get(`/approvalRequests/${requestId}`);
  const request = current.data || {};
  const resolvedType = targetType || request.targetType;
  const resolvedId = targetId || request.targetId;

  const response = await api.patch(`/approvalRequests/${requestId}`, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId || admin.adminId,
  });

  await patchTargetStatus(
    resolvedType,
    resolvedId,
    resolvedType === 'course' ? 'approved' : 'published'
  );

  return response.data;
};

export const rejectRequest = async (requestId, targetType, targetId, adminId, reason) => {
  const admin = requireAdminAuth();
  const current = await api.get(`/approvalRequests/${requestId}`);
  const request = current.data || {};
  const legacyReasonOnly = targetType && !targetId && !adminId && !reason;
  const resolvedType = legacyReasonOnly ? request.targetType : (targetType || request.targetType);
  const resolvedId = targetId || request.targetId;
  const resolvedReason = legacyReasonOnly ? targetType : (reason || '');

  const response = await api.patch(`/approvalRequests/${requestId}`, {
    status: 'rejected',
    reason: resolvedReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId || admin.adminId,
  });

  await patchTargetStatus(resolvedType, resolvedId, 'draft');
  return response.data;
};

export const getAuditLogs = async (params) => {
  try {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data.data;
  } catch (error) {
    return [];
  }
};

export const getTransactions = async (params) => {
  try {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Không thể tải lịch sử giao dịch.');
  }
};

export const getRevenueStatistics = async () => {
  try {
    const response = await api.get('/admin/revenue');
    return response.data?.data || { summary: {}, byCourse: [], byMonth: [] };
  } catch (error) {
    throw getApiError(error, 'Không thể tải thống kê doanh thu.');
  }
};
