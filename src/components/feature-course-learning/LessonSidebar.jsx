import React from 'react';

// EARS[State-driven]: WHILE rendering the sidebar, THE system SHALL display the list of lessons.
const LessonSidebar = ({ 
  lessons = [], 
  currentLessonId, 
  completedLessonIds = [], 
  onSelectLesson 
}) => {
  // EARS[Unwanted]: IF lessons array is empty or null, THE system SHALL display an empty state to avoid rendering a broken sidebar.
  if (!lessons || lessons.length === 0) {
    return (
      <div className="card shadow-sm border-0 h-100 rounded-4">
        <div className="card-body text-center text-muted p-4">
          <i className="bi bi-journal-x fs-1 mb-2"></i>
          <p className="mb-0">No lessons available for this course yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100 rounded-4 overflow-hidden d-flex flex-column">
      <div className="card-header bg-white border-bottom py-3">
        <h5 className="mb-0 fw-bold">Course Content</h5>
        <small className="text-muted">
          {completedLessonIds.length} / {lessons.length} completed
        </small>
      </div>
      
      <div className="list-group list-group-flush flex-grow-1 overflow-auto" style={{ maxHeight: '600px' }}>
        {lessons.map((lesson, index) => {
          const isActive = currentLessonId === lesson.id;
          const isCompleted = completedLessonIds.includes(lesson.id);
          
          return (
            <button
              key={lesson.id}
              type="button"
              className={`list-group-item list-group-item-action border-bottom py-3 d-flex align-items-center ${isActive ? 'active bg-primary border-primary' : ''}`}
              onClick={() => onSelectLesson && onSelectLesson(lesson.id)}
              data-testid={`lesson-item-${lesson.id}`}
            >
              <div className="me-3 fs-5">
                {/* EARS[State-driven]: IF lesson is completed, THE system SHALL display a green checkmark. */}
                {isCompleted ? (
                  <i className={`bi bi-check-circle-fill ${isActive ? 'text-white' : 'text-success'}`} data-testid={`check-${lesson.id}`}></i>
                ) : (
                  <i className={`bi bi-circle ${isActive ? 'text-white' : 'text-muted'}`}></i>
                )}
              </div>
              
              <div className="flex-grow-1 text-truncate">
                <div className={`fw-semibold mb-1 text-truncate ${isActive ? 'text-white' : 'text-dark'}`} title={lesson.title}>
                  {index + 1}. {lesson.title}
                </div>
                <div className={`small ${isActive ? 'text-white-50' : 'text-muted'}`}>
                  <i className="bi bi-clock me-1"></i>
                  {lesson.duration || '00:00'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LessonSidebar;
