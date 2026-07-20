import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span className="logo-text">IELTS Learning</span>
        </Link>
        <div className="header-actions">
          <button className="header-search-btn" aria-label="Search">
            Search
          </button>
          <button className="header-globe-btn" aria-label="Language">
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
