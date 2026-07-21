import api from './api';

export const auditLogService = {
  logAction: async (action, details) => {
    try {
      const response = await api.post('/auditLogs', {
        action,
        details,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  }
};
