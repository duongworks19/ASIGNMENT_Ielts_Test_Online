/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_API_01    | SPEC §3 CL-01          | Fetch courses with pagination headers correctly.
 * TC_API_02    | EARS[Unwanted]         | Throw proper error message when API fails.
 * -----------------------------------------------------------------------------------------
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { getCourses, getCourseById } from './courseLearning.service';

// Mock axios instance methods
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn()
      }))
    }
  };
});

describe('Course API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC_API_01
  it('getCourses fetches data and parses x-total-count header', async () => {
    api.get.mockResolvedValueOnce({
      data: [{ id: 'c1', title: 'Course 1' }],
      headers: { 'x-total-count': '10' }
    });
    
    const result = await getCourses({ page: 2, limit: 5 });
    
    expect(result.data).toHaveLength(1);
    expect(result.totalCount).toBe(10);
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('_page=2'));
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('_limit=5'));
  });

  // TC_API_02
  it('getCourses throws error when API call fails', async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { message: 'Network error from server' } }
    });
    
    await expect(getCourses()).rejects.toThrow('Network error from server');
  });
});
