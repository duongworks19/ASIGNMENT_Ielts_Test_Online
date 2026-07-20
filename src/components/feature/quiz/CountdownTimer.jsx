import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getRemainingTime } from '../../../utils/quizUtils';

/**
 * CountdownTimer Component
 * Displays the remaining time for the practice test.
 * 
 * @param {Object} props
 * @param {number} props.expireAt - The timestamp (in ms) when the quiz expires.
 * @param {Function} props.onExpire - Callback triggered when the timer reaches 0.
 */
const CountdownTimer = ({ expireAt, onExpire }) => {
  const [timeInfo, setTimeInfo] = useState(() => getRemainingTime(expireAt));

  useEffect(() => {
    // Check initial state in case it's already expired
    const initialTime = getRemainingTime(expireAt);
    if (initialTime.isExpired) {
      if (onExpire) onExpire();
      return; // No need to set interval
    }

    // EARS[State-driven]: THE timer SHALL update every second AND turn red if < 5 minutes remaining.
    const intervalId = setInterval(() => {
      const currentInfo = getRemainingTime(expireAt);
      setTimeInfo(currentInfo);

      // EARS[Event]: WHEN time reaches 0, THE system SHALL trigger onExpire.
      if (currentInfo.isExpired) {
        clearInterval(intervalId);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    // EARS[Unwanted]: Prevent memory leaks by clearing interval on unmount
    return () => clearInterval(intervalId);
  }, [expireAt, onExpire]);

  // Remove hardcoded text-dark so parent can style it, only force danger on warning
  const textColorClass = timeInfo.isWarning ? 'text-danger fw-bold' : 'fw-bold';

  return (
    <div className={`countdown-timer ${textColorClass} font-monospace`} style={{ fontSize: '22px' }} data-testid="countdown-timer">
      {timeInfo.formatted}
    </div>
  );
};

CountdownTimer.propTypes = {
  expireAt: PropTypes.number.isRequired,
  onExpire: PropTypes.func.isRequired,
};

export default CountdownTimer;
