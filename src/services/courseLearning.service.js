import axios from 'axios';

// EARS[State-driven]: THE system SHALL use the base URL for the JSON-Server API.
const API_URL = 'http://localhost:9999'; // JSON-server port (npm run server)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCourses = async (params = {}) => {
  try {
    const { page = 1, limit = 9, search = '', skill = '', level = '', priceType = '' } = params;

    // Lấy toàn bộ courses, lọc phía client để đảm bảo search hoạt động
    const queryParams = new URLSearchParams();
    if (skill) queryParams.append('skill', skill);
    if (level) queryParams.append('level', level);

    const response = await api.get(`/courses?${queryParams.toString()}`);
    let allCourses = Array.isArray(response.data)
      ? response.data
      : (response.data?.data || []);

    // EARS[Event]: ONLY return courses that have been approved or published to students.
    allCourses = allCourses.filter(c => c.status === 'approved' || c.status === 'published');

    // Lọc theo search keyword (client-side) — case-insensitive
    if (search) {
      const keyword = search.toLowerCase();
      allCourses = allCourses.filter(c =>
        (c.title || '').toLowerCase().includes(keyword) ||
        (c.description || '').toLowerCase().includes(keyword) ||
        (c.skill || '').toLowerCase().includes(keyword)
      );
    }

    // Lọc theo giá: free hoặc paid
    if (priceType === 'free') {
      allCourses = allCourses.filter(c => !c.price || c.price === 0);
    } else if (priceType === 'paid') {
      allCourses = allCourses.filter(c => c.price && c.price > 0);
    }

    // Phân trang client-side
    const totalCount = allCourses.length;
    const start = (page - 1) * limit;
    const paged = allCourses.slice(start, start + limit);

    return { data: paged, totalCount };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch courses');
  }
};


export const getCourseById = async (id) => {
  try {
    const response = await api.get(`/courses/${id}`);
    const course = response.data;
    
    // EARS[Event]: ONLY allow viewing if course is approved or published
    if (course.status !== 'approved' && course.status !== 'published') {
      throw new Error('Course is not available or pending approval.');
    }
    
    return course;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch course details');
  }
};

// EARS[State-driven]: WHILE Student is enrolled, getEnrollment returns single record by userId+courseId.
export const getEnrollment = async (userId, courseId) => {
  try {
    const response = await api.get(`/enrollments?userId=${userId}&courseId=${courseId}`);
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch enrollment status');
  }
};

// EARS[Event]: WHEN Student opens MyCoursesPage, fetch ALL enrollments for that user.
export const getEnrollmentsByUser = async (userId) => {
  try {
    const response = await api.get(`/enrollments?userId=${userId}`);
    return response.data; // Array of all enrollments for this user
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user enrollments');
  }
};

export const createEnrollment = async (userId, courseId) => {
  try {
    const payload = {
      userId,
      courseId,
      progress: 0,
      enrolledAt: new Date().toISOString()
    };
    const response = await api.post('/enrollments', payload);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create enrollment');
  }
};

// EARS[Event]: WHEN lesson completion changes, PATCH enrollments with new progress AND status.
export const updateEnrollmentProgress = async (enrollmentId, progressPercent, status = 'active') => {
  try {
    const response = await api.patch(`/enrollments/${enrollmentId}`, {
      progress: progressPercent,
      status // 'completed' when progress === 100
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update progress');
  }
};

export const getLessons = async (courseId) => {
  try {
    const response = await api.get(`/lessons?courseId=${courseId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch lessons');
  }
};

// EARS[State-driven]: Returns ALL lessonProgress records for a student in a course (array).
export const getLessonProgress = async (userId, courseId) => {
  try {
    const response = await api.get(`/lessonProgress?userId=${userId}&courseId=${courseId}`);
    return response.data; // Array of LessonProgress records
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch lesson progress');
  }
};

// EARS[Event]: Check if a specific lesson already has a lessonProgress record (POST vs PATCH decision).
export const getLessonProgressByLesson = async (userId, lessonId) => {
  try {
    const response = await api.get(`/lessonProgress?userId=${userId}&lessonId=${lessonId}`);
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch lesson progress by lesson');
  }
};

// EARS[Event]: WHEN no existing record, POST new lessonProgress.
export const createLessonProgress = async (data) => {
  try {
    const response = await api.post('/lessonProgress', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create lesson progress');
  }
};

// EARS[Event]: WHEN record exists, PATCH instead of creating duplicate.
export const updateLessonProgress = async (progressId, data) => {
  try {
    const response = await api.patch(`/lessonProgress/${progressId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update lesson progress');
  }
};

export default api;
