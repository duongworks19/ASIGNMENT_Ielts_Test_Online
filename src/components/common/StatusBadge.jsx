import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component hiển thị Badge trạng thái chuẩn màu hệ thống.
 * 
 * EARS[State-driven]: WHILE content status is `pending` or `rejected`, THE system SHALL display corresponding warning/danger badges.
 */
const StatusBadge = ({ status, className = '' }) => {
  // EARS[Unwanted]: WHERE an invalid status is provided, fallback to a default neutral badge.
  const getBadgeConfig = (statusStr) => {
    if (!statusStr) {
      return { color: 'bg-secondary', label: 'unknown' };
    }

    switch (statusStr.toLowerCase()) {
      case 'active':
      case 'approved':
        return { color: 'bg-success', label: statusStr };
      case 'pending':
      case 'locked':
        return { color: 'bg-warning text-dark', label: statusStr };
      case 'banned':
      case 'rejected':
        return { color: 'bg-danger', label: statusStr };
      default:
        return { color: 'bg-secondary', label: statusStr };
    }
  };

  const { color, label } = getBadgeConfig(status);

  return (
    <span className={`badge rounded-pill ${color} text-capitalize ${className}`}>
      {label}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
};

export default StatusBadge;
