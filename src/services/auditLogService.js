import axios from 'axios';

const API_URL = 'http://localhost:9999';

export const auditLogService = {
  logAction: async (action, details, userId = 'unknown') => {
    try {
      const response = await axios.post(`${API_URL}/auditLogs`, {
        action,
        userId,
        details,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  }
};
