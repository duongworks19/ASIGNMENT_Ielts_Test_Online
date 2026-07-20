import axios from 'axios';
import { normalizeTest } from '../utils/testModel';

const API_URL = 'http://localhost:9999';

const createTestApprovalRequest = async (test) => {
  if (!test?.id || test.status !== 'pending') return;

  const existing = await axios.get(`${API_URL}/approvalRequests`, {
    params: {
      targetType: 'test',
      targetId: test.id,
      status: 'pending',
    },
  });

  if (Array.isArray(existing.data) && existing.data.length > 0) return;

  await axios.post(`${API_URL}/approvalRequests`, {
    id: `req-test-${test.id}-${Date.now()}`,
    targetType: 'test',
    targetId: test.id,
    teacherId: test.teacherId || 'u-teacher-001',
    status: 'pending',
    message: `Teacher submitted test "${test.title}" for admin approval.`,
    createdAt: new Date().toISOString(),
  });
};

// EARS[Ubiquitous]: The service shall perform REST API CRUD operations for practice tests linked to courses
export const teacherTestService = {
  getTests: async (teacherId) => {
    const response = await axios.get(`${API_URL}/tests`);
    return response.data
      .filter((test) => !teacherId || test.teacherId === teacherId)
      .map(normalizeTest);
  },
  getTestsByCourse: async (courseId) => {
    const response = await axios.get(`${API_URL}/tests?courseId=${courseId}`);
    return response.data.map(normalizeTest);
  },
  getTestById: async (id) => {
    const response = await axios.get(`${API_URL}/tests/${id}`);
    return normalizeTest(response.data);
  },
  createTest: async (testData) => {
    const response = await axios.post(`${API_URL}/tests`, testData);
    return response.data;
  },
  updateTest: async (id, testData) => {
    const response = await axios.patch(`${API_URL}/tests/${id}`, testData);
    await createTestApprovalRequest(response.data);
    return response.data;
  },
  deleteTest: async (id) => {
    const response = await axios.delete(`${API_URL}/tests/${id}`);
    return response.data;
  }
};
