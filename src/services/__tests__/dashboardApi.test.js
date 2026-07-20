/**
 * Traceability Matrix:
 * - dashboardApi.getTestAttemptsByUser => DASH-05, DASH-06 (Fetch history list)
 * - dashboardApi.getAttemptById        => DASH-07 (Fetch attempt detail)
 * - dashboardApi.getLessonProgressByUser => DASH-01 (Fetch lesson stats)
 */

import axios from 'axios';
import {
  getTestAttemptsByUser,
  getAttemptById,
  getLessonProgressByUser
} from '../dashboardApi';

jest.mock('axios');

describe('dashboardApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // getTestAttemptsByUser
  // ==========================================

  it('getTestAttemptsByUser: returns attempts array on success (Happy Path)', async () => {
    const mockData = [{ id: '1', skill: 'Reading' }, { id: '2', skill: 'Listening' }];
    axios.get.mockResolvedValue({ data: mockData });

    const result = await getTestAttemptsByUser('user-1');

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/testAttempts?userId=user-1');
    expect(result).toEqual(mockData);
  });

  it('getTestAttemptsByUser: throws error on network failure (Error Case)', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    await expect(getTestAttemptsByUser('user-1')).rejects.toThrow('Network Error');
  });

  // ==========================================
  // getAttemptById
  // ==========================================

  it('getAttemptById: returns single attempt on success (Happy Path)', async () => {
    const mockAttempt = { id: '123', testTitle: 'IELTS Mock', overallBandScore: 7.5 };
    axios.get.mockResolvedValue({ data: mockAttempt });

    const result = await getAttemptById('123');

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/testAttempts/123');
    expect(result).toEqual(mockAttempt);
  });

  it('getAttemptById: throws 404 error when attempt not found (Error Case)', async () => {
    axios.get.mockRejectedValue(new Error('Request failed with status code 404'));

    await expect(getAttemptById('invalid-id')).rejects.toThrow('404');
  });

  // ==========================================
  // getLessonProgressByUser
  // ==========================================

  it('getLessonProgressByUser: returns lesson progress array (Happy Path)', async () => {
    const mockProgress = [{ id: 'lp-1', lessonId: 'lesson-001', completed: true }];
    axios.get.mockResolvedValue({ data: mockProgress });

    const result = await getLessonProgressByUser('user-1');

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/lessonProgress?userId=user-1');
    expect(result).toEqual(mockProgress);
  });

  it('getLessonProgressByUser: throws error on server failure (Error Case)', async () => {
    axios.get.mockRejectedValue(new Error('500 Internal Server Error'));

    await expect(getLessonProgressByUser('user-1')).rejects.toThrow('500');
  });
});
