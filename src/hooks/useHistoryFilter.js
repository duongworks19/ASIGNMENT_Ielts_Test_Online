import { useState, useMemo, useCallback } from 'react';

/**
 * useHistoryFilter Hook
 * Custom Hook chứa logic lọc danh sách bài làm ở phía Client.
 * 
 * @param {Array} initialAttempts - Danh sách gốc ban đầu
 * @returns {Object} { filters, handleFilterChange, filteredAttempts }
 */
export const useHistoryFilter = (initialAttempts = []) => {
  const [filters, setFilters] = useState({
    keyword: '',
    skill: 'All',
    date: ''
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => {
      // Ngăn chặn re-render nếu giá trị không thực sự thay đổi
      if (prev.keyword === newFilters.keyword && 
          prev.skill === newFilters.skill && 
          prev.date === newFilters.date) {
        return prev;
      }
      return newFilters;
    });
  }, []);

  const filteredAttempts = useMemo(() => {
    if (!Array.isArray(initialAttempts)) return [];

    return initialAttempts.filter((attempt) => {
      // EARS[Event]: WHEN the Student enters a keyword, THE system SHALL filter by test title.
      const matchKeyword = filters.keyword === '' || 
        (attempt.testTitle && attempt.testTitle.toLowerCase().includes(filters.keyword.toLowerCase()));
      
      // EARS[State-driven]: WHILE the Student selects a skill, THE system SHALL only display attempts assessing that skill.
      const matchSkill = filters.skill === 'All' || attempt.skill === filters.skill;
      
      // EARS[State-driven]: WHILE a date is selected, THE system SHALL filter attempts submitted on that exact date.
      let matchDate = true;
      if (filters.date && attempt.submittedAt) {
        // Tách chuỗi ISO "2026-06-01T10:00:00Z" -> "2026-06-01"
        const attemptDate = new Date(attempt.submittedAt).toISOString().split('T')[0];
        matchDate = attemptDate === filters.date;
      }
      
      return matchKeyword && matchSkill && matchDate;
    });
  }, [initialAttempts, filters]);

  return { filters, handleFilterChange, filteredAttempts };
};
