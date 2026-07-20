import axios from 'axios';

// Base URL trung tâm cho JSON-Server (chạy bằng `npm run server` ở cổng 9999).
// Tất cả service nên import từ đây để tránh hard-code cổng ở nhiều nơi.
export const API_URL = 'http://localhost:9999';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
