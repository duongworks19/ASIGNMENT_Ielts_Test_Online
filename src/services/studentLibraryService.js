import api from './api';

export const studentLibraryService = {
  /**
   * Lấy danh sách tài nguyên thư viện công khai cho sinh viên
   */
  async getPublicResources() {
    const res = await api.get('/library_resources?visibility=public');
    return res.data;
  }
};
