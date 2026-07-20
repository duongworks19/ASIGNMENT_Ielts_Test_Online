import axios from 'axios';

const API_URL = 'http://localhost:9999';

export const teacherCourseService = {
  getCourses: async (teacherId) => {
    const response = await axios.get(`${API_URL}/courses?teacherId=${teacherId}`);
    return response.data;
  },
  getCourseById: async (id) => {
    const response = await axios.get(`${API_URL}/courses/${id}`);
    return response.data;
  },
  createCourse: async (courseData) => {
    const response = await axios.post(`${API_URL}/courses`, courseData);
    return response.data;
  },
  updateCourse: async (id, courseData) => {
    const response = await axios.patch(`${API_URL}/courses/${id}`, courseData);
    return response.data;
  },
  deleteCourse: async (id) => {
    const response = await axios.delete(`${API_URL}/courses/${id}`);
    return response.data;
  }
};
