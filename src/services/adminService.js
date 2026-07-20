import axios from 'axios';
import { getCurrentUser } from './authService';

const API_URL = 'http://localhost:9999';

export function requireAdminAuth() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Session expired. Please sign in again.');
  }
  if (user.role !== 'admin') {
    throw new Error(`FORBIDDEN: Account "${user.email}" does not have Admin permission.`);
  }
  return { adminId: user.id, adminName: user.name || user.fullName || user.email };
}

export const getUsers = async (params) => axios.get(`${API_URL}/users`, { params });

export const updateUserRole = async (userId, newRole) => {
  requireAdminAuth();
  const response = await axios.patch(`${API_URL}/users/${userId}`, { role: newRole });
  return response.data;
};

export const updateUserStatus = async (userId, newStatus, lockedUntil = null) => {
  requireAdminAuth();
  const payload = { status: newStatus };
  if (lockedUntil !== null) payload.lockedUntil = lockedUntil;
  const response = await axios.patch(`${API_URL}/users/${userId}`, payload);
  return response.data;
};

export const deleteUser = async (userId) => {
  requireAdminAuth();
  const response = await axios.delete(`${API_URL}/users/${userId}`);
  return response.data;
};

export const getCourses = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/courses`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateCourse = async (courseId, data) => {
  requireAdminAuth();
  const response = await axios.patch(`${API_URL}/courses/${courseId}`, data);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  requireAdminAuth();
  const response = await axios.delete(`${API_URL}/courses/${courseId}`);
  return response.data;
};

export const getLessons = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/lessons`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateLesson = async (lessonId, data) => {
  requireAdminAuth();
  const response = await axios.patch(`${API_URL}/lessons/${lessonId}`, data);
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  requireAdminAuth();
  const response = await axios.delete(`${API_URL}/lessons/${lessonId}`);
  return response.data;
};

export const getTests = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/tests`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const updateTest = async (testId, data) => {
  requireAdminAuth();
  const response = await axios.patch(`${API_URL}/tests/${testId}`, data);
  return response.data;
};

export const deleteTest = async (testId) => {
  requireAdminAuth();
  const response = await axios.delete(`${API_URL}/tests/${testId}`);
  return response.data;
};

export const getApprovalRequests = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/approvalRequests`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

const patchTargetStatus = async (targetType, targetId, status) => {
  if (!targetType || !targetId) return;
  const collection = `${targetType}s`;
  await axios.patch(`${API_URL}/${collection}/${targetId}`, {
    status,
    updatedAt: new Date().toISOString(),
  });
};

export const approveRequest = async (requestId, targetType, targetId, adminId) => {
  const admin = requireAdminAuth();
  const current = await axios.get(`${API_URL}/approvalRequests/${requestId}`);
  const request = current.data || {};
  const resolvedType = targetType || request.targetType;
  const resolvedId = targetId || request.targetId;

  const response = await axios.patch(`${API_URL}/approvalRequests/${requestId}`, {
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
  const current = await axios.get(`${API_URL}/approvalRequests/${requestId}`);
  const request = current.data || {};
  const legacyReasonOnly = targetType && !targetId && !adminId && !reason;
  const resolvedType = legacyReasonOnly ? request.targetType : (targetType || request.targetType);
  const resolvedId = targetId || request.targetId;
  const resolvedReason = legacyReasonOnly ? targetType : (reason || '');

  const response = await axios.patch(`${API_URL}/approvalRequests/${requestId}`, {
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
    const response = await axios.get(`${API_URL}/auditLogs`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getTransactions = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/transactions`, { params });
    return response.data;
  } catch (error) {
    return [];
  }
};
