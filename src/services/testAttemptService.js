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
    let limit = Number(normalized.attemptLimit || 0);

    if (normalized.courseId) {
      try {
        const { getEnrollment, getCourseById } = await import('./courseLearning.service');
        const course = await getCourseById(normalized.courseId);
        
        if (course) {
          const isFreeCourse = !course.price || course.price === 0;
          let hasPremium = false;
          
          if (user?.id) {
            const enrollment = await getEnrollment(user.id, normalized.courseId);
            hasPremium = enrollment && enrollment.isPremium;
          }
          
          if (!isFreeCourse || hasPremium) {
            return { limit: Infinity, used: 0, remaining: Infinity, attempts: [] };
          }
          
          if (isFreeCourse && !hasPremium) {
            // Find all tests in this course to match backend logic
            const response = await api.get('/tests');
            const courseTests = response.data.filter(t => String(t.courseId) === String(course.id));
            const testIds = courseTests.map(t => t.id);
            
            const allAttemptsRes = await api.get('/testAttempts');
            const owner = getAttemptOwner(user);
            
            const courseAttempts = allAttemptsRes.data.filter(att => {
              const sameUser = owner.userId && String(att.userId) === String(owner.userId);
              const sameGuest = owner.guestId && String(att.guestId) === String(owner.guestId);
              return testIds.includes(att.testId) && (sameUser || sameGuest);
            });
            
            const courseLimit = 3;
            return {
              limit: courseLimit,
              used: courseAttempts.length,
              remaining: Math.max(0, courseLimit - courseAttempts.length),
              attempts: courseAttempts
            };
          }
        }
      } catch (err) {
        console.error('Error checking premium status:', err);
      }
    }

    if (!limit) {
      return { limit, used: 0, remaining: Infinity, attempts: [] };
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
