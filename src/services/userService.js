import api, { getApiError } from './api';
import { changePassword as changePasswordRequest } from './authService';

export const updateUserProfile = async (userIdOrData, maybeData) => {
  const data = maybeData || userIdOrData;
  try {
    const response = await api.patch('/auth/profile', data);
    return response.data.user;
  } catch (error) {
    throw getApiError(error, 'Có lỗi xảy ra khi cập nhật hồ sơ.');
  }
};

export const changeCurrentUserPassword = changePasswordRequest;
