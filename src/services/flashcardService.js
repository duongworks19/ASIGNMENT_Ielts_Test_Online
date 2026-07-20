import api from './api';

// EARS[Event]: WHEN Student mở deck flashcard của 1 khóa học, lấy toàn bộ thẻ theo courseId.
export const getFlashcardDecksByCourse = async (courseId) => {
  try {
    const response = await api.get(`/flashcardDecks?courseId=${courseId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tải được danh sách bộ flashcard');
  }
};

// Lấy danh sách thẻ theo courseId
export const getFlashcardsByCourse = async (courseId) => {
  try {
    const response = await api.get(`/flashcards?courseId=${courseId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tải được danh sách flashcard');
  }
};

// Lấy số lượng thẻ của 1 khóa (dùng để hiển thị badge "20 thẻ" ngoài trang chi tiết).
export const getFlashcardCount = async (courseId) => {
  try {
    const cards = await getFlashcardsByCourse(courseId);
    return cards.length;
  } catch {
    return 0;
  }
};
