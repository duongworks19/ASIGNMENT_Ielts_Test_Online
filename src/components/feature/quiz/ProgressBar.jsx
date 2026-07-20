import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProgressBar Component
 * Displays the completion percentage of the current practice test.
 * 
 * @param {Object} props
 * @param {number} props.completed - Number of questions completed/answered.
 * @param {number} props.total - Total number of questions.
 */
const ProgressBar = ({ completed, total }) => {
  // EARS[Unwanted]: If total is less than or equal to 0, or not a number, fallback to 0% to prevent division by zero or NaN.
  if (typeof total !== 'number' || total <= 0 || isNaN(total)) {
    return (
      <div className="progress rounded-pill shadow-sm" style={{ height: '12px' }} data-testid="progress-container">
        <div 
          className="progress-bar bg-primary rounded-pill" 
          role="progressbar" 
          style={{ width: '0%' }} 
          aria-valuenow="0" 
          aria-valuemin="0" 
          aria-valuemax="100"
          data-testid="progress-bar-inner"
        ></div>
      </div>
    );
  }

  // EARS[Unwanted]: If completed is less than 0, treat it as 0. If completed > total, cap it at total.
  let safeCompleted = completed;
  if (typeof completed !== 'number' || isNaN(completed) || completed < 0) {
    safeCompleted = 0;
  } else if (completed > total) {
    safeCompleted = total;
  }

  // EARS[State-driven]: WHILE a Test session is active, THE system SHALL display current completion percentage.
  const percentage = Math.round((safeCompleted / total) * 100);

  return (
    <div className="progress rounded-pill shadow-sm" style={{ height: '12px' }} data-testid="progress-container">
      <div 
        className="progress-bar bg-primary rounded-pill" 
        role="progressbar" 
        style={{ width: `${percentage}%`, transition: 'width 0.4s ease' }} 
        aria-valuenow={percentage} 
        aria-valuemin="0" 
        aria-valuemax="100"
        data-testid="progress-bar-inner"
      ></div>
    </div>
  );
};

ProgressBar.propTypes = {
  completed: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default ProgressBar;
