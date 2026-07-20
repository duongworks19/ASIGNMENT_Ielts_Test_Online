import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/feature/Navbar';
import Footer from '../components/feature/Footer';
import './MainLayout.css';

export default function MainLayout() {
  const location = useLocation();
  const isEmbed = new URLSearchParams(location.search).get("embed") === "true";

  if (isEmbed) {
    return (
      <div className="main-layout" style={{ background: 'transparent', minHeight: 'auto' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
