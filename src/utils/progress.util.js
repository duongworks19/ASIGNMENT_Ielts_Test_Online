/**
 * progress.util.js
 * Utility functions for calculating and navigating course/lesson progress.
 * SPEC ref: SPEC §4 Ubiquitous, §4 Event-driven (CL-08, CL-09), §6 Derived Data Rules
 */

/**
 * Calculate course progress percentage safely.
 *
 * EARS[Ubiquitous]: THE system SHALL keep `progress` between 0 and 100.
 * EARS[Ubiquitous]: THE system SHALL calculate progress from approved lessons only:
 *   (completedApprovedLessons / totalApprovedLessons) * 100, rounded to nearest integer.
 * EARS[Unwanted]: WHERE progress calculation receives invalid or missing records,
 *   THE system SHALL recover by treating missing progress as 0 and SHALL NOT crash.
 *
 * @param {number} completedCount - number of completed approved lessons
 * @param {number} totalCount     - total number of approved lessons
 * @returns {number} integer 0-100
 */
export const calculateProgress = (completedCount, totalCount) => {
  // Guard: avoid division by zero
  if (!totalCount || totalCount <= 0) return 0;
  if (!completedCount || completedCount <= 0) return 0;

  const raw = (completedCount / totalCount) * 100;
  // Clamp strictly between 0 and 100
  return Math.min(100, Math.max(0, Math.round(raw)));
};

/**
 * Get the next lesson in order.
 *
 * EARS[Event]: WHEN a Student clicks Next Lesson,
 *   THE system SHALL navigate to the next lesson by `order` within the same course.
 * EARS[Edge]: IF the current lesson is the last one, THEN return null.
 *
 * @param {Array}  lessons         - array of lesson objects with { id, order }
 * @param {string} currentLessonId - id of the current lesson
 * @returns {object|null} next lesson object, or null if none
 */
export const getNextLesson = (lessons, currentLessonId) => {
  if (!lessons || lessons.length === 0) return null;
  const sorted = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIndex = sorted.findIndex((l) => l.id === currentLessonId);
  if (currentIndex === -1 || currentIndex === sorted.length - 1) return null;
  return sorted[currentIndex + 1];
};

/**
 * Get the previous lesson in order.
 *
 * EARS[Event]: WHEN a Student clicks Previous Lesson,
 *   THE system SHALL navigate to the previous lesson by `order` within the same course.
 * EARS[Edge]: IF the current lesson is the first one, THEN return null (button disabled).
 *
 * @param {Array}  lessons         - array of lesson objects with { id, order }
 * @param {string} currentLessonId - id of the current lesson
 * @returns {object|null} previous lesson object, or null if none
 */
export const getPreviousLesson = (lessons, currentLessonId) => {
  if (!lessons || lessons.length === 0) return null;
  const sorted = [...lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIndex = sorted.findIndex((l) => l.id === currentLessonId);
  if (currentIndex <= 0) return null;
  return sorted[currentIndex - 1];
};
