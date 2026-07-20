import React from 'react';

// EARS[State-driven]: WHILE component is rendering, THE system SHALL determine the button text and style based on the `enrollment` state.
const EnrollmentCTA = ({ 
  courseId, 
  enrollment, 
  isLoading, 
  onEnroll, 
  onContinue 
}) => {
  // EARS[Unwanted]: IF required props are missing (e.g., courseId is null), THE system SHALL disable the CTA to prevent invalid operations.
  if (!courseId) {
    return (
      <button className="btn btn-secondary disabled" disabled>
        Course Unavailable
      </button>
    );
  }

  // Handle Join Course action
  const handleEnrollClick = () => {
    // EARS[Unwanted]: IF user clicks while loading, THE system SHALL ignore the click to prevent double submission.
    if (isLoading) return;
    
    // EARS[Event]: WHEN user clicks "Join Course" AND not enrolled, THEN the system SHALL trigger the onEnroll callback.
    if (onEnroll) {
      onEnroll(courseId);
    }
  };

  // Handle Continue Learning action
  const handleContinueClick = () => {
    // EARS[Event]: WHEN user clicks "Continue Learning" AND already enrolled, THEN the system SHALL trigger the onContinue callback.
    if (onContinue) {
      onContinue(courseId);
    }
  };

  if (enrollment) {
    // Bố cục khi đã đăng ký (Enrolled)
    return (
      <button 
        className="btn btn-success" 
        onClick={handleContinueClick}
        disabled={isLoading}
        data-testid="btn-continue-learning"
      >
        <i className="bi bi-play-circle-fill me-2"></i>
        Continue Learning
      </button>
    );
  }

  // Bố cục khi chưa đăng ký (Not Enrolled)
  return (
    <button 
      className="btn btn-primary" 
      onClick={handleEnrollClick}
      disabled={isLoading}
      data-testid="btn-join-course"
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Processing...
        </>
      ) : (
        <>
          <i className="bi bi-plus-circle-fill me-2"></i>
          Join Course
        </>
      )}
    </button>
  );
};

export default EnrollmentCTA;
