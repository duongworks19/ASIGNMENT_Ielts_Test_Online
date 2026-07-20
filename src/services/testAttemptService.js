import api from './api';
import {
  getAttemptExpiredAt,
  getAttemptOwner,
  isAttemptCounted,
  matchesTestId,
  normalizeTest,
} from '../utils/testModel';

export const testAttemptService = {
  getAttemptsForTestOwner: async (testId, owner) => {
    const response = await api.get('/testAttempts');
    return response.data.filter((attempt) => {
      const sameTest = matchesTestId(attempt.testId, testId);
      const sameUser = owner.userId && String(attempt.userId) === String(owner.userId);
      const sameGuest = owner.guestId && String(attempt.guestId) === String(owner.guestId);
      return sameTest && (sameUser || sameGuest);
    });
  },

  getRemainingAttempts: async (test, user) => {
    const normalized = normalizeTest(test);
    const limit = Number(normalized.attemptLimit || 0);
    if (!limit) {
      return { limit, used: 0, remaining: Infinity, attempts: [] };
    }

    if (user?.id && normalized.courseId) {
      try {
        const { getEnrollment, getCourseById } = await import('./courseLearning.service');
        const enrollment = await getEnrollment(user.id, normalized.courseId);
        if (enrollment) {
          const course = await getCourseById(normalized.courseId);
          const isFreeCourse = !course.price || course.price === 0;
          if (!isFreeCourse || enrollment.isPremium) {
            return { limit: Infinity, used: 0, remaining: Infinity, attempts: [] };
          }
        }
      } catch (err) {
        console.error('Error checking premium status:', err);
      }
    }

    const owner = getAttemptOwner(user);
    const attempts = await testAttemptService.getAttemptsForTestOwner(normalized.id, owner);
    const counted = attempts.filter(isAttemptCounted);

    return {
      limit,
      used: counted.length,
      remaining: Math.max(0, limit - counted.length),
      attempts,
    };
  },

  createAttempt: async (test, user) => {
    const normalized = normalizeTest(test);
    const startTime = new Date().toISOString();
    const owner = getAttemptOwner(user);
    const response = await api.post('/testAttempts', {
      ...owner,
      testId: normalized.id,
      skill: normalized.skill,
      startTime,
      expiredAt: getAttemptExpiredAt(startTime, normalized.durationMinutes),
      status: 'in-progress',
      answers: {},
    });
    return response.data;
  },

  completeAttempt: async (attemptId, answers, scorePayload = {}) => {
    const response = await api.patch(`/testAttempts/${attemptId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      answers,
      ...scorePayload,
    });
    return response.data;
  },
};
