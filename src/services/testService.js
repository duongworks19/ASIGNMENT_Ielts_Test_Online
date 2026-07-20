import api from './api';
import { matchesTestId, normalizeTest } from '../utils/testModel';

export const testService = {
  getTests: async () => {
    const response = await api.get('/tests');
    return response.data.map(normalizeTest);
  },

  getPublishedTests: async () => {
    const response = await api.get('/tests');
    return response.data
      .map(normalizeTest)
      .filter((test) => test.status === 'published');
  },

  getFreeTests: async () => {
    const response = await api.get('/tests');
    return response.data
      .map(normalizeTest)
      .filter((test) => test.status === 'published' && (test.testMode === 'free' || test.isFreePreview));
  },

  getTestsByCourse: async (courseId) => {
    const response = await api.get('/tests');
    return response.data
      .map(normalizeTest)
      .filter((test) => String(test.courseId) === String(courseId) && test.status === 'published');
  },

  getTestById: async (id) => {
    const response = await api.get(`/tests/${id}`);
    return normalizeTest(response.data);
  },

  updateTest: async (id, payload) => {
    const response = await api.patch(`/tests/${id}`, payload);
    return normalizeTest(response.data);
  },

  getQuestionsForTest: async (testId) => {
    const response = await api.get('/questions');
    return response.data
      .filter((question) => matchesTestId(question.testId, testId))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  },
};
