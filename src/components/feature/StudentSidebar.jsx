import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './StudentSidebar.css';

const NAV_ITEMS = [
  {
    section: 'Learning',
    links: [
      { to: '/learning/dashboard', icon: <i className="bi bi-grid-1x2"></i>, label: 'Dashboard', end: true },
      { to: '/learning/my-courses', icon: <i className="bi bi-journal-bookmark"></i>, label: 'My Courses', end: true },
      { to: '/learning/courses', icon: <i className="bi bi-collection"></i>, label: 'Course Catalog', end: false },
      { to: '/learning/history', icon: <i className="bi bi-clock-history"></i>, label: 'Learning History', end: false },
    ]
  },
  {
    section: 'Account',
    links: [
      { to: '/profile', icon: <i className="bi bi-person-circle"></i>, label: 'My Profile', end: true },
    ]
  }
];

const StudentSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Lấy chữ cái đầu làm avatar fallback
  const initials = (user?.name || user?.fullName || user?.email || 'S')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="student-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">I</div>
        <div>
          <div className="brand-title">IELTS Master</div>
          <div className="brand-subtitle">Student Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ section, links }) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {links.map(({ to, icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar" style={{ overflow: 'hidden' }}>
            {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-name">{user?.name || user?.fullName || 'Student'}</div>
            <div className="user-role">Student</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          ↩ Log out
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
