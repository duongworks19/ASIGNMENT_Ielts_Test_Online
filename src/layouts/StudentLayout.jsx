import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/feature/Navbar';
import Footer from '../components/feature/Footer';
import './StudentLayout.css';

export default function StudentLayout() {
  const location = useLocation();
  const isEmbed = new URLSearchParams(location.search).get("embed") === "true";

  if (isEmbed) {
    return (
      <div className="student-layout" data-student-theme="light" style={{ background: 'transparent', minHeight: 'auto' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="student-layout" data-student-theme="light">
      <Navbar variant="student" />

      <div className="student-layout__shell">
        <main className="student-layout__main">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
