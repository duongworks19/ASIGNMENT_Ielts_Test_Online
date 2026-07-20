import axios from 'axios';

const AUTH_STORAGE_KEY = 'ielts_auth_user';
const API_URL = 'http://localhost:9999'; // Default port for json-server

const ROLE_DASHBOARD_PATHS = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/learning', // Student landing page should go to their student home page
};

const MOCK_GOOGLE_USERS = {
  student: {
    id: 'google-student-1',
    name: 'Tien Dat',
    email: 'ntiendat2108@gmail.com',
    avatar: 'https://www.gravatar.com/avatar/?d=mp',
    role: 'student',
    provider: 'google',
  },
  teacher: {
    id: 'google-teacher-1',
    name: 'IELTS Mentor',
    email: 'teacher@ieltslearning.com',
    avatar: 'https://www.gravatar.com/avatar/?d=mp',
    role: 'teacher',
    provider: 'google',
  },
  admin: {
    id: 'google-admin-1',
    name: 'System Admin',
    email: 'admin@ieltslearning.com',
    avatar: 'https://www.gravatar.com/avatar/?d=mp',
    role: 'admin',
    provider: 'google',
  },
};

export function getCurrentUser() {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuthUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth:user-changed'));
  return user;
}

export async function loginWithGoogle(options = {}) {
  const role = ['student', 'teacher', 'admin'].includes(options.role) ? options.role : 'student';

  await new Promise((resolve) => {
    setTimeout(resolve, 450);
  });

  return saveAuthUser(MOCK_GOOGLE_USERS[role]);
}

// Thêm hàm Login bằng Email & Password kết nối tới db.json qua json-server
export async function loginWithEmailAndPassword(email, password) {
  try {
    // Tải toàn bộ user về và tự filter bằng JavaScript 
    // để tránh lỗi cú pháp query của các phiên bản json-server khác nhau
    const response = await axios.get(`${API_URL}/users`);
    const allUsers = response.data;
    
    // Tìm user khớp email và mật khẩu
    const matchedUser = allUsers.find(
      u => u.email === email && String(u.password) === String(password)
    );
    
    if (matchedUser) {
      return saveAuthUser(matchedUser); // Lưu phiên đăng nhập
    } else {
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Login failed");
  }
}

// Thêm hàm Register để lưu user mới vào db.json
export async function registerNewUser(userData) {
  try {
    // 1. Kiểm tra email đã tồn tại chưa bằng cách kéo toàn bộ về kiểm tra thủ công
    const checkRes = await axios.get(`${API_URL}/users`);
    const allUsers = checkRes.data || [];
    const emailExists = allUsers.some(u => u.email === userData.email);
    
    if (emailExists) {
      throw new Error("Email is already registered");
    }
    
    // 2. Định dạng dữ liệu user mới
    const newUser = {
      ...userData,
      id: "u-student-" + new Date().getTime(),
      role: 'student',
      status: 'active',
      avatar: 'https://www.gravatar.com/avatar/?d=mp',
      createdAt: new Date().toISOString()
    };
    
    // 3. Gửi request POST để lưu vào db.json
    const response = await axios.post(`${API_URL}/users`, newUser);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Register failed");
  }
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('auth:user-changed'));
}

export function getDashboardPathByRole(role) {
  return ROLE_DASHBOARD_PATHS[role] || ROLE_DASHBOARD_PATHS.student;
}

export function isRoleAllowed(user, allowedRoles = []) {
  if (!user) {
    return false;
  }

  return allowedRoles.length === 0 || allowedRoles.includes(user.role);
}
