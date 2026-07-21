import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LessonContentPlayer from '../../components/feature-course-learning/LessonContentPlayer';
import {
  getLessons,
  getLessonProgress,
  getEnrollment,
  updateEnrollmentProgress,
  getLessonProgressByLesson,
  createLessonProgress,
  updateLessonProgress,
} from '../../services/courseLearning.service';
import { calculateProgress, getNextLesson, getPreviousLesson } from '../../utils/progress.util';
import { getCurrentUser } from '../../services/authService';
import { testService } from '../../services/testService';
import { getFlashcardsByCourse } from '../../services/flashcardService';
import './LessonPage.css';

const LessonPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUser()?.id || '';

  const [lessons, setLessons] = useState([]);
  const [courseTests, setCourseTests] = useState([]);
  const [courseFlashcards, setCourseFlashcards] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [markError, setMarkError] = useState(null);
  const [resolvedUserId, setResolvedUserId] = useState(currentUserId);
  const [activeView, setActiveView] = useState({ type: 'lesson', id: lessonId });

  useEffect(() => {
    setActiveView({ type: 'lesson', id: lessonId });
  }, [lessonId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userId = currentUserId;
        if (!userId) throw new Error('Phiên đăng nhập không hợp lệ.');
        setResolvedUserId(userId);

        const [lessonsData, progressRecords, enrollmentData, testsData, flashcardsData] = await Promise.all([
          getLessons(courseId),
          getLessonProgress(userId, courseId),
          getEnrollment(userId, courseId),
          testService.getTestsByCourse(courseId).catch(() => []),
          getFlashcardsByCourse(courseId).catch(() => [])
        ]);

        setLessons(lessonsData);
        setCourseTests(testsData);
        setCourseFlashcards(flashcardsData);
        setEnrollment(enrollmentData);

        const ids = Array.isArray(progressRecords)
          ? progressRecords.filter((p) => p.completed).map((p) => p.lessonId)
          : [];
        setCompletedIds(ids);

        if (!lessonId && lessonsData.length > 0) {
          navigate(`/learning/courses/${courseId}/lessons/${lessonsData[0].id}`, { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Failed to load lesson data.');
      } finally {
        setIsLoading(false);
      }
    };
    if (courseId) fetchData();
  }, [courseId, lessonId, navigate, currentUserId]);

  const currentLesson = lessons.find((l) => l.id === lessonId) || null;
  const isCurrentCompleted = completedIds.includes(lessonId);
  const prevLesson = lessons.length > 0 ? getPreviousLesson(lessons, lessonId) : null;
  const nextLesson = lessons.length > 0 ? getNextLesson(lessons, lessonId) : null;
  const isLastLesson = !nextLesson;
  const progressPercent = enrollment?.progress ?? 0;

  const handleSelectLesson = (selectedLessonId) => {
    setActiveView({ type: 'lesson', id: selectedLessonId });
    navigate(`/learning/courses/${courseId}/lessons/${selectedLessonId}`);
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      setActiveView({ type: 'lesson', id: prevLesson.id });
      navigate(`/learning/courses/${courseId}/lessons/${prevLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      setActiveView({ type: 'lesson', id: nextLesson.id });
      navigate(`/learning/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  };

  const handleMarkCompleted = async () => {
    if (!lessonId || isMarkingComplete || isCurrentCompleted) return;
    setIsMarkingComplete(true);
    setMarkError(null);
    try {
      const existing = await getLessonProgressByLesson(resolvedUserId, lessonId);
      if (existing) {
        await updateLessonProgress(existing.id, { completed: true, completedAt: new Date().toISOString() });
      } else {
        await createLessonProgress({
          id: `lp-${Date.now()}`,
          userId: resolvedUserId,
          courseId,
          lessonId,
          completed: true,
          completedAt: new Date().toISOString(),
        });
      }
      const newCompletedIds = completedIds.includes(lessonId) ? completedIds : [...completedIds, lessonId];
      setCompletedIds(newCompletedIds);
      const newProgress = calculateProgress(newCompletedIds.length, lessons.length);
      const newStatus = newProgress === 100 ? 'completed' : 'active';
      if (enrollment) {
        await updateEnrollmentProgress(enrollment.id, newProgress, newStatus);
        setEnrollment((prev) => ({ ...prev, progress: newProgress, status: newStatus }));
      }
      if (nextLesson) navigate(`/learning/courses/${courseId}/lessons/${nextLesson.id}`);
    } catch (err) {
      setMarkError(err.message || 'Failed to mark lesson as completed. Please try again.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lesson-page-wrapper justify-content-center align-items-center d-flex" data-testid="loading-spinner">
        <div className="text-center text-white">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-page-wrapper p-4">
        <div className="alert alert-danger shadow-sm rounded-4 d-flex align-items-center gap-2 m-4" role="alert" data-testid="error-alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>
            <strong>Unable to load lesson.</strong> {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-page-wrapper">
      {/* ── Top Bar ── */}
      <div className="lesson-topbar">
        <button
          className="btn btn-sm text-white-50 d-flex align-items-center gap-2 p-0"
          style={{ background: 'none', border: 'none', fontSize: '0.82rem' }}
          onClick={() => navigate(`/learning/courses/${courseId}`)}
        >
          <i className="bi bi-arrow-left"></i>
          <span className="d-none d-md-inline">Back to course</span>
        </button>

        <span className="lesson-topbar-title">{currentLesson?.title || 'Select a lesson'}</span>

        <div className="lesson-topbar-progress">
          <div className="topbar-progress-track">
            <div className="topbar-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="topbar-progress-label">{progressPercent}% complete</span>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="lesson-layout">

        {/* Left: Content */}
        <div className="lesson-content-panel">
          {activeView.type === 'lesson' && (
            <>
              {/* Player Card */}
              <div className="lesson-player-card">
                <LessonContentPlayer lesson={currentLesson} />
              </div>

              {/* Action Bar */}
              <div className="lesson-action-bar" style={{ margin: '0 24px 24px' }}>
                {markError && (
                  <div className="w-100 alert alert-danger py-2 mb-2 d-flex align-items-center gap-2 rounded-3" role="alert" data-testid="mark-error">
                    <i className="bi bi-x-circle-fill"></i>{markError}
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
                  <button className="action-btn action-btn-prev" onClick={handlePrevLesson} disabled={!prevLesson} data-testid="btn-prev-lesson">
                    <i className="bi bi-arrow-left"></i> Previous
                  </button>

                  {isCurrentCompleted ? (
                    <span className="action-btn action-btn-done" data-testid="badge-completed">
                      <i className="bi bi-check-circle-fill"></i> Completed
                    </span>
                  ) : (
                    <button className="action-btn action-btn-mark" onClick={handleMarkCompleted} disabled={isMarkingComplete} data-testid="btn-mark-complete">
                      {isMarkingComplete ? (
                        <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...</>
                      ) : (
                        <><i className="bi bi-check2-circle"></i> Mark as Completed</>
                      )}
                    </button>
                  )}

                  {isLastLesson ? (
                    <button className="action-btn action-btn-finish" onClick={() => navigate('/learning/courses')} data-testid="btn-finish-course">
                      <i className="bi bi-trophy-fill"></i> Finish Course
                    </button>
                  ) : (
                    <button className="action-btn action-btn-next" onClick={handleNextLesson} disabled={!nextLesson} data-testid="btn-next-lesson">
                      Next <i className="bi bi-arrow-right"></i>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          {activeView.type === 'test' && (
            <div className="w-100 h-100 p-0 overflow-hidden rounded-4" style={{ minHeight: '85vh', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <iframe src={`/learning/tests/${activeView.id}?embed=true`} className="w-100 h-100 border-0" title="Practice Test" style={{ minHeight: '85vh' }} />
            </div>
          )}

          {activeView.type === 'flashcard' && (
            <div className="w-100 h-100 p-0 overflow-hidden rounded-4" style={{ minHeight: '85vh', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <iframe src={`/learning/flashcards/${activeView.id}?embed=true`} className="w-100 h-100 border-0" title="Flashcards" style={{ minHeight: '85vh' }} />
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="lesson-sidebar-panel">
          <div className="sidebar-header">
            <h5>Course Content</h5>
            <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.8rem' }}>
              <span className="text-muted">{completedIds.length} / {lessons.length} completed</span>
              <span className="fw-bold" style={{ color: '#16a34a' }}>{progressPercent}%</span>
            </div>
            <div className="sidebar-progress-bar mt-2">
              <div className="sidebar-progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="lesson-list">
            {lessons.map((lesson, index) => {
              const isActive = activeView.type === 'lesson' && lessonId === lesson.id;
              const isCompleted = completedIds.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  className={`lesson-list-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectLesson(lesson.id)}
                  data-testid={`lesson-item-${lesson.id}`}
                >
                  <div className={`lesson-icon ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                    {isCompleted
                      ? <i className="bi bi-check-circle-fill" data-testid={`check-${lesson.id}`}></i>
                      : <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{index + 1}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lesson-item-title">{lesson.title}</div>
                    <div className="lesson-item-duration">
                      <i className="bi bi-play-circle me-1"></i>{lesson.duration || '00:00'}
                    </div>
                  </div>
                </button>
              );
            })}

            {courseTests.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-2 fw-bold text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Practice Tests
                </div>
                {courseTests.map((test) => {
                  const isActive = activeView.type === 'test' && activeView.id === test.id;
                  return (
                  <button
                    key={test.id}
                    className={`lesson-list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveView({ type: 'test', id: test.id })}
                    title="Open Practice Test"
                  >
                    <div className={`lesson-icon ${isActive ? 'active' : 'pending'}`} style={!isActive ? { background: '#e0f2fe', color: '#0ea5e9' } : {}}>
                      <i className="bi bi-journal-text fs-6"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lesson-item-title">{test.title}</div>
                      <div className="lesson-item-duration text-primary">
                        <i className="bi bi-play-circle me-1"></i>Start Test
                      </div>
                    </div>
                  </button>
                  );
                })}
              </>
            )}

            {courseFlashcards.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-2 fw-bold text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Flashcards
                </div>
                {/* Lấy danh sách các deck duy nhất từ flashcards */}
                {[...new Set(courseFlashcards.map(c => c.deckId))].map(deckId => {
                  const isActive = activeView.type === 'flashcard' && activeView.id === deckId;
                  return (
                  <button
                    key={deckId}
                    className={`lesson-list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveView({ type: 'flashcard', id: deckId })}
                    title="Study Flashcards"
                  >
                    <div className={`lesson-icon ${isActive ? 'active' : 'pending'}`} style={!isActive ? { background: '#ede9fe', color: '#8b5cf6' } : {}}>
                      <i className="bi bi-layers-fill fs-6"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lesson-item-title">Topic Vocabulary</div>
                      <div className="lesson-item-duration" style={{ color: '#8b5cf6' }}>
                        <i className="bi bi-play-circle me-1"></i>Study Deck
                      </div>
                    </div>
                  </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LessonPage;

