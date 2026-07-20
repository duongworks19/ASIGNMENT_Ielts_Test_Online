import axios from 'axios';

const API_URL = 'http://localhost:9999';

export const teacherLessonService = {
  getLessons: async (teacherId) => {
    const response = await axios.get(`${API_URL}/lessons?teacherId=${teacherId}`);
    return response.data;
  },
  getLessonsByCourse: async (courseId) => {
    const response = await axios.get(`${API_URL}/lessons?courseId=${courseId}`);
    return response.data;
  },
  getLessonById: async (id) => {
    const response = await axios.get(`${API_URL}/lessons/${id}`);
    return response.data;
  },
  createLesson: async (lessonData) => {
    const response = await axios.post(`${API_URL}/lessons`, lessonData);
    return response.data;
  },
  updateLesson: async (id, lessonData) => {
    const response = await axios.patch(`${API_URL}/lessons/${id}`, lessonData);
    return response.data;
  },
  deleteLesson: async (id) => {
    const response = await axios.delete(`${API_URL}/lessons/${id}`);
    return response.data;
  }
};
