import axios from 'axios';

const API_URL = 'http://localhost:9999';

// EARS[Ubiquitous]: The service shall retrieve enrollments, students, and test attempts from JSON-Server
export const teacherStudentService = {
  getEnrollments: async () => {
    const response = await axios.get(`${API_URL}/enrollments`);
    return response.data;
  },
  getStudents: async () => {
    const response = await axios.get(`${API_URL}/users?role=student`);
    return response.data;
  },
  getTestAttempts: async () => {
    const response = await axios.get(`${API_URL}/testAttempts`);
    return response.data;
  },
  gradeAttempt: async (attemptId, gradeData) => {
    const response = await axios.patch(`${API_URL}/testAttempts/${attemptId}`, {
      ...gradeData,
      gradingStatus: 'graded',
      status: 'completed'
    });
    return response.data;
  }
};
