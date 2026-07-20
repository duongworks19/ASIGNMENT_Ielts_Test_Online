import React from 'react';

// EARS[State-driven]: WHILE a lesson is selected, THE system SHALL render the appropriate media or text player based on the available content format.
const LessonContentPlayer = ({ lesson }) => {
  // EARS[Unwanted]: IF the lesson object is null or undefined, THE system SHALL render a safe placeholder.
  if (!lesson) {
    return (
      <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-light h-100 d-flex justify-content-center align-items-center">
        <div>
          <i className="bi bi-display fs-1 text-muted mb-3 d-block"></i>
          <h4 className="text-muted fw-bold">Select a lesson</h4>
          <p className="text-muted">Choose a lesson from the sidebar to start learning.</p>
        </div>
      </div>
    );
  }

  const { title, contentUrl, content, description } = lesson;
  const isMp4 = contentUrl && contentUrl.toLowerCase().endsWith('.mp4');

  // EARS[State-driven]: IF contentUrl is missing AND content is missing, THE system SHALL inform the user that no content is available.
  const hasNoContent = !contentUrl && !content;

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 d-flex flex-column">
      {/* Media Player Section */}
      {contentUrl ? (
        <div className="ratio ratio-16x9 bg-dark flex-shrink-0">
          {/* EARS[State-driven]: IF contentUrl is an MP4 file, THE system SHALL use the HTML5 video tag, OTHERWISE it SHALL use an iframe. */}
          {isMp4 ? (
            <video controls className="w-100 h-100 object-fit-contain" data-testid="video-player">
              <source src={contentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe 
              src={contentUrl.replace('watch?v=', 'embed/')} 
              title={title || 'Lesson Video'} 
              allowFullScreen 
              className="w-100 h-100 border-0"
              data-testid="iframe-player"
            ></iframe>
          )}
        </div>
      ) : null}

      {/* Content Section */}
      <div className="card-body p-4 flex-grow-1 overflow-auto">
        <h3 className="card-title fw-bold mb-3">{title || 'Untitled Lesson'}</h3>
        
        {description && (
          <p className="text-muted lead mb-4">{description}</p>
        )}

        {hasNoContent && (
          <div className="alert alert-warning border-0 bg-warning bg-opacity-10" role="alert" data-testid="no-content-alert">
            <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
            No video or text content is available for this lesson.
          </div>
        )}

        {/* EARS[State-driven]: IF text content exists, THE system SHALL render it below the video or as the primary content if video is missing. */}
        {content && (
          <div className="lesson-text-content mt-2" data-testid="text-content">
            {/* Trong đồ án thực tế có thể parse markdown hoặc HTML an toàn ở đây */}
            <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonContentPlayer;
