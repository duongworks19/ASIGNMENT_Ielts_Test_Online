import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { logout, getCurrentUser } from '../services/authService';
import '../styles/teacher-portal.css';
import './TeacherLayout.css';

export default function TeacherLayout() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="teacher-layout">

      {/* Sidebar */}
      <div className="teacher-sidebar p-3 shadow-sm">

        {/* Brand */}
        <div className="text-center py-3 mb-4">
          <h4 className="fw-bold mb-0 lh-1">
            <span className="text-primary">IELTS</span>
            <span className="text-dark"> Master</span>
          </h4>
          <span className="text-secondary small fw-medium mt-1 d-block">Teaching Workspace</span>
        </div>

        {/* Thông tin giáo viên đăng nhập */}
        <div className="d-flex align-items-center gap-3 px-3 py-2 mb-4 bg-light rounded-3 border">
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm" style={{ width: '40px', height: '40px' }}>
            {currentUser?.fullName?.charAt(0) || 'T'}
          </div>
          <div className="overflow-hidden">
            <h6 className="mb-0 text-dark text-truncate fw-semibold">{currentUser?.fullName || 'IELTS Instructor'}</h6>
            <span className="text-muted small">Giáo viên</span>
          </div>
        </div>

        {/* Danh sách link điều hướng */}
        <nav className="nav flex-column flex-grow-1">
          <NavLink to="/teacher/dashboard" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-grid-1x2"></i> Dashboard
          </NavLink>
          <NavLink to="/teacher/courses" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-journal-bookmark"></i> Quản lý Khóa học
          </NavLink>
          <NavLink to="/teacher/lessons" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-file-earmark-text"></i> Quản lý Bài học
          </NavLink>
          <NavLink to="/teacher/tests" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-patch-question"></i> Quản lý Đề thi
          </NavLink>
          <NavLink to="/teacher/students" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-people"></i> Quản lý Học viên
          </NavLink>
          <NavLink to="/teacher/flashcards" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-layers"></i> Quản lý Flashcard
          </NavLink>
          <NavLink to="/teacher/marking-queue" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-ui-checks"></i> Hàng chờ chấm
          </NavLink>
          <NavLink to="/teacher/marking-history" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-clock-history"></i> Lịch sử chấm bài
          </NavLink>
          <NavLink to="/teacher/library" className={({ isActive }) => `teacher-nav-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-collection"></i> Thư viện Tài nguyên
          </NavLink>
        </nav>

        {/* Nút đăng xuất ở dưới cùng */}
        <div className="pt-3 border-top mt-auto">
          <Button
            variant="light"
            onClick={handleLogout}
            className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-medium text-secondary"
          >
            <i className="bi bi-box-arrow-right"></i> Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column overflow-auto">
        <header className="bg-white py-3 px-4 d-flex justify-content-between align-items-center shadow-sm" style={{ zIndex: 10 }}>
          <span className="text-secondary small fw-medium">
            <i className="bi bi-building me-2"></i>Học kỳ: Summer 2026 | FPT University
          </span>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-medium">
            <i className="bi bi-check-circle-fill me-2"></i>Mock Server Connected
          </span>
        </header>

        <main className="p-4 flex-grow-1">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
