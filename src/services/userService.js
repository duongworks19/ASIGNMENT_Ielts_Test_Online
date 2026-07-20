import axios from 'axios';

const API_URL = 'http://localhost:9999'; // Cổng chạy chung với npm start (chứa db.json)

/**
 * Cập nhật thông tin profile của user lên db.json.
 * Mọi field truyền vào sẽ đè lên object user trong json-server nếu dùng PUT, 
 * nếu dùng PATCH thì nó chỉ sửa các trường được gửi. Chúng ta sẽ dùng PATCH cho an toàn.
 * 
 * @param {string} userId - ID của user cần update
 * @param {Object} data - Payload chứa các trường muốn cập nhật
 * @returns {Promise<Object>} Trả về object user sau khi update
 */
export const updateUserProfile = async (userId, data) => {
  try {
    const response = await axios.patch(`${API_URL}/users/${userId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
  }
};
