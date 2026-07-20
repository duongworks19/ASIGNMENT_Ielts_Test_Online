import axios from 'axios';
import { matchesTestId } from '../utils/testModel';

const API_URL = 'http://localhost:9999';

// EARS[Ubiquitous]: The service shall perform REST API CRUD operations for questions linked to tests
export const teacherQuestionService = {
  getQuestions: async (testId) => {
    const response = await axios.get(`${API_URL}/questions`);
    return response.data
      .filter((question) => matchesTestId(question.testId, testId))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  },
  getQuestionById: async (id) => {
    const response = await axios.get(`${API_URL}/questions/${id}`);
    return response.data;
  },
  createQuestion: async (questionData) => {
    const response = await axios.post(`${API_URL}/questions`, questionData);
    return response.data;
  },
  updateQuestion: async (id, questionData) => {
    const response = await axios.patch(`${API_URL}/questions/${id}`, questionData);
    return response.data;
  },
  deleteQuestion: async (id) => {
    const response = await axios.delete(`${API_URL}/questions/${id}`);
    return response.data;
  }
};
