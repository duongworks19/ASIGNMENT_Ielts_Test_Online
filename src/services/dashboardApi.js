import axios from 'axios';

const API_URL = process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:5000';

/**
 * dashboardApi.js
 * Service layer cho tat ca cac goi API lien quan den Student Dashboard va Learning History.
 * Tat ca ham deu tra ve Promise - component/hook se tu handle loading/error.
 */

/**
 * Lay danh sach tat ca bai test attempts cua mot user.
 * @param {string} userId
 * @returns {Promise<Array>} Danh sach test attempts
 */
export const getTestAttemptsByUser = async (userId) => {
  const res = await axios.get(`${API_URL}/testAttempts?userId=${userId}`);
  return res.data;
};

/**
 * Lay chi tiet mot bai test attempt theo ID.
 * @param {string} attemptId
 * @returns {Promise<Object>} Chi tiet bai test
 */
export const getAttemptById = async (attemptId) => {
  const res = await axios.get(`${API_URL}/testAttempts/${attemptId}`);
  return res.data;
};

/**
 * Lay danh sach lesson progress cua mot user.
 * @param {string} userId
 * @returns {Promise<Array>} Danh sach lesson progress
 */
export const getLessonProgressByUser = async (userId) => {
  const res = await axios.get(`${API_URL}/lessonProgress?userId=${userId}`);
  return res.data;
};
