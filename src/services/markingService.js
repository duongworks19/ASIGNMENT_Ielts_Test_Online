import api from './api';

export const markingService = {
  // Lấy danh sách bài đang chờ chấm (status: pending, skill: Writing/Speaking)
  getPendingSubmissions: async () => {
    const response = await api.get('/testAttempts');
    return response.data.filter(
      (attempt) => attempt.gradingStatus === 'pending' && (attempt.skill === 'Writing' || attempt.skill === 'Speaking')
    );
  },

  // Lấy danh sách bài đã chấm
  getMarkedSubmissions: async () => {
    const response = await api.get('/testAttempts');
    return response.data.filter(
      (attempt) => attempt.gradingStatus === 'graded' && (attempt.skill === 'Writing' || attempt.skill === 'Speaking')
    ).sort((a, b) => {
      const dateA = new Date(a.gradedAt || a.completedAt || 0).getTime();
      const dateB = new Date(b.gradedAt || b.completedAt || 0).getTime();
      return dateB - dateA;
    });
  },

  // Cập nhật điểm và trạng thái thành graded
  gradeSubmission: async (attemptId, { score, criteriaScores, feedback }) => {
    const payload = {
      score: Number(score),
      overallBandScore: Number(score),
      criteriaScores,
      feedback: feedback,
      gradingStatus: 'graded',
      status: 'completed',
      gradedAt: new Date().toISOString()
    };
    const response = await api.patch(`/testAttempts/${attemptId}`, payload);
    return response.data;
  }
};
