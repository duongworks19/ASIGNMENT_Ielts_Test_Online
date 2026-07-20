/**
 * Traceability Matrix:
 * - Requirement: DASH-06 (Search/filter test history by skill or date).
 * - Requirement: DASH_FILT_001 (Clear filters resets to full list).
 * - Component: HistoryFilter (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryFilter from '../HistoryFilter';

describe('HistoryFilter Component', () => {
  let mockOnFilterChange;

  beforeEach(() => {
    mockOnFilterChange = jest.fn();
  });

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders all filter inputs correctly', () => {
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    expect(screen.getByTestId('filter-keyword')).toBeInTheDocument();
    expect(screen.getByTestId('filter-skill')).toBeInTheDocument();
    expect(screen.getByTestId('filter-date')).toBeInTheDocument();
    expect(screen.getByTestId('filter-clear-btn')).toBeInTheDocument();
  });

  it('calls onFilterChange when keyword is typed (Happy Path)', () => {
    // EARS[Event]: WHEN the Student enters a keyword, THE system SHALL filter.
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    const keywordInput = screen.getByTestId('filter-keyword');
    fireEvent.change(keywordInput, { target: { value: 'IELTS Mock' } });
    
    // onFilterChange called on mount (with defaults) and on change
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      keyword: 'IELTS Mock',
      skill: 'All',
      date: ''
    });
  });

  it('calls onFilterChange when skill is selected (Happy Path)', () => {
    // EARS[State-driven]: WHILE the Student selects a specific skill, THE system SHALL filter.
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    const skillSelect = screen.getByTestId('filter-skill');
    fireEvent.change(skillSelect, { target: { value: 'Reading' } });
    
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      keyword: '',
      skill: 'Reading',
      date: ''
    });
  });

  it('calls onFilterChange when date is selected (Happy Path)', () => {
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    const dateInput = screen.getByTestId('filter-date');
    fireEvent.change(dateInput, { target: { value: '2026-06-11' } });
    
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      keyword: '',
      skill: 'All',
      date: '2026-06-11'
    });
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('trims whitespace from keyword before passing to callback (Boundary Value)', () => {
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    const keywordInput = screen.getByTestId('filter-keyword');
    fireEvent.change(keywordInput, { target: { value: '   spaced keyword   ' } });
    
    // Đảm bảo string được trim sạch sẽ trước khi filter
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      keyword: 'spaced keyword',
      skill: 'All',
      date: ''
    });
  });

  it('resets all fields and calls onFilterChange with defaults when Clear is clicked (Error/Reset Case)', () => {
    // EARS[Unwanted]: If filters are cleared, THE system SHALL reset to full list.
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    // Đổi state
    fireEvent.change(screen.getByTestId('filter-keyword'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByTestId('filter-skill'), { target: { value: 'Listening' } });
    
    // Click Clear
    const clearBtn = screen.getByTestId('filter-clear-btn');
    expect(clearBtn).not.toBeDisabled();
    fireEvent.click(clearBtn);
    
    // Check form fields UI reflect reset
    expect(screen.getByTestId('filter-keyword').value).toBe('');
    expect(screen.getByTestId('filter-skill').value).toBe('All');
    
    // Check callback reset state
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      keyword: '',
      skill: 'All',
      date: ''
    });
  });

  it('disables Clear button when all fields are empty/default (Boundary Value)', () => {
    render(<HistoryFilter onFilterChange={mockOnFilterChange} />);
    
    const clearBtn = screen.getByTestId('filter-clear-btn');
    expect(clearBtn).toBeDisabled(); // Nút clear chỉ bấm được khi có ít nhất 1 filter đang active
  });
});
