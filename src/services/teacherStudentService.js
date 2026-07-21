import api from './api';

export const teacherStudentService = {
  getEnrollments: async () => (await api.get('/enrollments')).data,
  getStudents: async () => (await api.get('/teacher/students')).data.data,
  getTestAttempts: async () => (await api.get('/testAttempts')).data,
  gradeAttempt: async (attemptId, gradeData) => (
    await api.patch(`/testAttempts/${attemptId}`, {
      ...gradeData,
      gradingStatus: 'graded',
      status: 'completed',
    })
  ).data,
};
