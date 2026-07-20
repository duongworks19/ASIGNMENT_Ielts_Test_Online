import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './Footer.css';

export default function Footer() {
  const currentUser = getCurrentUser();
  const showGuestLinks = !currentUser;

  return (
    <footer className="footer-fer202">
      <div className="footer-fer202-container">
        <h2 className="footer-fer202-title"><span style={{color: '#38bdf8'}}>IELTS</span> Master</h2>
        <p className="footer-fer202-desc">
          Hệ thống học và luyện thi IELTS trực tuyến toàn diện.<br />
          This project is developed as a capstone assignment for the <strong>FER202</strong> course.
        </p>

        {showGuestLinks && (
          <div className="footer-fer202-links">
            <Link to="/">Home</Link>
            <Link to="/online-courses">Online courses</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}

        <div className="footer-fer202-copyright">
          &copy; {new Date().getFullYear()} IELTS Master Team. All rights reserved for academic purposes.
        </div>
      </div>
    </footer>
  );
}
