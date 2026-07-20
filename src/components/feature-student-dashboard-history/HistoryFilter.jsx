import React, { useState, useEffect } from 'react';

/**
 * HistoryFilter Component
 * Bộ lọc cho bảng lịch sử làm bài (Test Attempts).
 * 
 * @param {function} onFilterChange - Callback trả về object { keyword, skill, date }
 */
const HistoryFilter = ({ onFilterChange }) => {
  const [keyword, setKeyword] = useState('');
  const [skill, setSkill] = useState('All');
  const [date, setDate] = useState('');

  // EARS[Event]: WHEN the Student enters a keyword, selects a skill, or picks a date, THE system SHALL trigger the filter callback.
  // Sử dụng useEffect để debounce (tự nhiên bằng React cycle) và gom chung các trigger bắn lên cha.
  useEffect(() => {
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        keyword: keyword.trim(),
        skill: skill,
        date: date
      });
    }
  }, [keyword, skill, date, onFilterChange]);

  // EARS[Unwanted]: If filters are cleared, THE system SHALL reset to full list.
  const handleClear = () => {
    setKeyword('');
    setSkill('All');
    setDate('');
  };

  // EARS[Ubiquitous]: THE system SHALL use Bootstrap classes for responsive layout.
  return (
    <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#ffffff' }}>
      <div className="card-body">
        <div className="row g-3 align-items-center">
          
          {/* Keyword Search */}
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0" id="search-addon" style={{ fontSize: '0.9rem' }}>
                Search
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-2" 
                placeholder="Test name..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Search"
                aria-describedby="search-addon"
                data-testid="filter-keyword"
              />
            </div>
          </div>

          {/* Skill Dropdown */}
          <div className="col-12 col-md-3">
            {/* EARS[State-driven]: WHILE the Student selects a specific skill, THE system SHALL filter accordingly. */}
            <select 
              className="form-select text-muted" 
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              data-testid="filter-skill"
              aria-label="Filter by skill"
            >
              <option value="All">All Skills</option>
              <option value="Listening">Listening</option>
              <option value="Reading">Reading</option>
              <option value="Writing">Writing</option>
              <option value="Speaking">Speaking</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="col-12 col-md-3">
            <input 
              type="date" 
              className="form-control text-muted" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="filter-date"
              aria-label="Filter by date"
            />
          </div>

          {/* Clear Button */}
          <div className="col-12 col-md-2 text-md-end">
            <button 
              className="btn btn-outline-secondary w-100" 
              onClick={handleClear}
              disabled={!keyword && skill === 'All' && !date}
              data-testid="filter-clear-btn"
            >
              Clear
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HistoryFilter;
