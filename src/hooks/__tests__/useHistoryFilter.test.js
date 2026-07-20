import { renderHook, act } from '@testing-library/react';
import { useHistoryFilter } from '../useHistoryFilter';

describe('useHistoryFilter Hook', () => {
  const mockAttempts = [
    { id: '1', testTitle: 'IELTS Mock 1', skill: 'Listening', submittedAt: '2026-06-01T10:00:00Z' },
    { id: '2', testTitle: 'IELTS Mock 2', skill: 'Reading', submittedAt: '2026-06-02T10:00:00Z' },
    { id: '3', testTitle: 'TOEFL Mock', skill: 'Listening', submittedAt: '2026-06-02T12:00:00Z' }
  ];

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('returns all attempts by default (Happy Path)', () => {
    const { result } = renderHook(() => useHistoryFilter(mockAttempts));
    expect(result.current.filteredAttempts).toHaveLength(3);
  });

  it('filters by keyword (Happy Path)', () => {
    const { result } = renderHook(() => useHistoryFilter(mockAttempts));
    act(() => {
      result.current.handleFilterChange({ keyword: 'IELTS', skill: 'All', date: '' });
    });
    expect(result.current.filteredAttempts).toHaveLength(2);
  });

  it('filters by skill (Happy Path)', () => {
    const { result } = renderHook(() => useHistoryFilter(mockAttempts));
    act(() => {
      result.current.handleFilterChange({ keyword: '', skill: 'Reading', date: '' });
    });
    expect(result.current.filteredAttempts).toHaveLength(1);
    expect(result.current.filteredAttempts[0].id).toBe('2');
  });

  it('filters by date (Happy Path)', () => {
    const { result } = renderHook(() => useHistoryFilter(mockAttempts));
    act(() => {
      result.current.handleFilterChange({ keyword: '', skill: 'All', date: '2026-06-02' });
    });
    // Có 2 bài test cùng ngày 02
    expect(result.current.filteredAttempts).toHaveLength(2);
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================
  
  it('handles empty initial attempts safely (Boundary Value)', () => {
    const { result } = renderHook(() => useHistoryFilter(null));
    expect(result.current.filteredAttempts).toEqual([]);
  });
});
