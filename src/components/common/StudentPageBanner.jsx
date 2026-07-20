import React from 'react';

export default function StudentPageBanner({ 
  title, 
  subtitle, 
  badgeText, 
  badgeIcon, 
  children 
}) {
  return (
    <div style={{
      background: 'linear-gradient(120deg, #1e3a8a 0%, #3b82f6 100%)',
      padding: '80px 0 60px',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <div className="container text-center">
        {badgeText && (
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
            {badgeIcon && <i className={`bi ${badgeIcon} fs-5`}></i>}
            <span className="fw-semibold" style={{ letterSpacing: '1px' }}>{badgeText}</span>
          </div>
        )}
        <h1 className="display-4 fw-bolder mb-3">{title}</h1>
        {subtitle && (
          <p className="lead mx-auto" style={{ maxWidth: '700px', opacity: 0.9 }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
