import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useDashboardData } from '../useDashboardData';

jest.mock('axios');

describe('useDashboardData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and calculates dashboard data successfully (Happy Path)', async () => {
    const mockAttempts = [
      { submittedAt: '2026-06-01T00:00:00Z', overallBandScore: 6.0, timeSpent: 3600, skill: 'Listening' },
      { submittedAt: '2026-06-02T00:00:00Z', overallBandScore: 7.0, timeSpent: 3600, skill: 'Reading' },
    ];
    const mockLessons = [
      { status: 'completed' },
      { status: 'in-progress' }
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes('testAttempts')) return Promise.resolve({ data: mockAttempts });
      if (url.includes('lessonProgress')) return Promise.resolve({ data: mockLessons });
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useDashboardData('user-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data.stats.completedLessons).toBe(1);
    expect(result.current.data.stats.completedTests).toBe(2);
    expect(result.current.data.stats.averageBandScore).toBe(6.5); // (6+7)/2
    expect(result.current.data.stats.studyHours).toBe(2); // 7200s = 2h
  });

  it('handles math with empty arrays safely (Boundary Value)', async () => {
    axios.get.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDashboardData('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.stats.averageBandScore).toBe('N/A');
    expect(result.current.data.stats.completedTests).toBe(0);
  });

  it('handles API errors correctly (Error Case)', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useDashboardData('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch dashboard data. Please try again later.');
  });
});
