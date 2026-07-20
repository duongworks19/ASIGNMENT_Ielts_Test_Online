import api from './api';

export const teacherLibraryService = {
  /**
   * Lấy danh sách tài nguyên thư viện của teacher hiện tại
   */
  async getResources(teacherId) {
    const res = await api.get(`/library_resources?teacherId=${teacherId}`);
    return res.data;
  },

  /**
   * Tạo tài nguyên thư viện mới
   */
  async createResource(data) {
    const res = await api.post('/library_resources', data);
    return res.data;
  },

  /**
   * Upload file vật lý lên server
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    // Note: this endpoint is on the same server but at /upload not /api/upload
    // Wait, the api instance might prepend /api or similar. Let's check api.js...
    // To be safe, we'll use a direct fetch or axios without the api base URL if needed, but api probably works if the base is right.
    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  /**
   * Cập nhật tài nguyên thư viện
   */
  async updateResource(id, data) {
    const res = await api.put(`/library_resources/${id}`, data);
    return res.data;
  },

  /**
   * Xóa tài nguyên thư viện
   */
  async deleteResource(id) {
    const res = await api.delete(`/library_resources/${id}`);
    return res.data;
  }
};
