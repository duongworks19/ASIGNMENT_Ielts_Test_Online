import React from 'react';

/**
 * StatCard Component
 * Hiển thị một thẻ thống kê ngắn gọn (VD: Completed Lessons, Average Band Score).
 * 
 * @param {string} title - Tiêu đề của thông số.
 * @param {number|string} value - Giá trị thông số cần hiển thị.
 * @param {React.ReactNode} icon - Icon minh họa (nếu có).
 */
const StatCard = ({ title, value, icon }) => {
  // EARS[State-driven]: WHILE value is missing (null, undefined, rỗng), THE system SHALL fallback to "N/A" and maintain stable UI.
  const isMissing = value === null || value === undefined || value === '';
  
  // EARS[State-driven]: WHILE the Student has no completed lessons (value is exactly 0), THE completed lesson stat SHALL show 0.
  const displayValue = isMissing ? 'N/A' : value;

  // EARS[Ubiquitous]: THE system SHALL use Bootstrap classes for responsive and consistent design.
  return (
    <div 
      className="card h-100 shadow-sm border-0" 
      style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%)', 
        borderTop: '4px solid #0052ff' // Sử dụng màu primary của theme
      }}
    >
      <div className="card-body d-flex flex-row align-items-center justify-content-between p-4">
        <div>
          <h6 
            className="card-subtitle mb-1 text-muted text-uppercase fw-semibold" 
            style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
          >
            {title}
          </h6>
          <h3 className="card-title mb-0 fw-bolder text-dark">
            {displayValue}
          </h3>
        </div>
        {icon && (
          <div className="text-primary fs-2">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
