/**
 * Calculates the remaining time based on an expiration timestamp.
 * 
 * @param {number} expireAt - The timestamp (in ms) when the quiz expires.
 * @returns {Object} { totalMs, formatted: 'MM:SS' or 'HH:MM:SS', isWarning: boolean, isExpired: boolean }
 */
export const getRemainingTime = (expireAt) => {
  if (!expireAt || typeof expireAt !== 'number' || expireAt <= Date.now()) {
    return {
      totalMs: 0,
      formatted: '00:00',
      isWarning: true,
      isExpired: true,
    };
  }

  const now = Date.now();
  const diffMs = expireAt - now;

  if (diffMs <= 0) {
    return {
      totalMs: 0,
      formatted: '00:00',
      isWarning: true,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours.toString().padStart(2, '0')}:`;
  }
  formatted += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = diffMs <= 5 * 60 * 1000; // less than or equal to 5 minutes

  return {
    totalMs: diffMs,
    formatted,
    isWarning,
    isExpired: false,
  };
};

/**
 * Converts a raw score percentage into an IELTS Band Score (Mock).
 * IELTS bands are usually 0.0 to 9.0 in half-band increments.
 * 
 * @param {number} correct - Number of correct answers.
 * @param {number} total - Total number of questions.
 * @returns {number} The band score (0.0 to 9.0).
 */
export const convertBandScore = (correct, total) => {
  if (typeof correct !== 'number' || typeof total !== 'number' || total <= 0 || correct < 0) {
    return 0.0;
  }
  const safeCorrect = Math.min(correct, total);
  
  // Simple mock conversion based on standard IELTS Reading mapping (approximate)
  // For a 40-question test: 39-40=9.0, 37-38=8.5, 35-36=8.0, 33-34=7.5, 30-32=7.0...
  // We'll calculate percentage and map it to a band.
  const percentage = safeCorrect / total;
  
  if (percentage >= 0.975) return 9.0;
  if (percentage >= 0.925) return 8.5;
  if (percentage >= 0.875) return 8.0;
  if (percentage >= 0.825) return 7.5;
  if (percentage >= 0.750) return 7.0;
  if (percentage >= 0.675) return 6.5;
  if (percentage >= 0.575) return 6.0;
  if (percentage >= 0.475) return 5.5;
  if (percentage >= 0.375) return 5.0;
  if (percentage >= 0.250) return 4.5;
  if (percentage >= 0.150) return 4.0;
  return 0.0;
};
