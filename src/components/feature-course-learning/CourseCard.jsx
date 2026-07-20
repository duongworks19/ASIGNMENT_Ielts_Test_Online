import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=600&q=80';

const CourseCard = ({ course }) => {
  if (!course) return null;

  const {
    id, title, thumbnail, teacherName, teacherId,
    skill, level, price, enrolledCount, rating
  } = course;

  const displayThumbnail = thumbnail || FALLBACK_IMG;
  const displayTeacher   = teacherName || teacherId || 'IELTS Expert';

  const displayPrice = price > 0
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    : 'Free';

  const skillClass = skill ? `skill-${skill.toLowerCase()}` : 'skill-general';

  return (
    <div className="card course-card-custom" data-testid={`course-card-${id || 'unknown'}`}>
      <Link to={`/learning/courses/${id}`} className="text-decoration-none text-dark d-flex flex-column h-100">

        {/* ── Thumbnail ── */}
        <div className="course-card-img-wrapper">
          <img
            src={displayThumbnail}
            className="course-card-img"
            alt={title}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
          />
          {/* Skill ribbon */}
          <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
            <span className={`skill-badge ${skillClass}`}>
              {skill || 'General'}
            </span>
          </div>
          {/* Level badge */}
          {level && (
            <div className="level-badge-top">
              <i className="bi bi-bullseye me-1 text-warning"></i>
              {level}
            </div>
          )}
        </div>

        {/* ── Card Body ── */}
        <div className="course-card-body">
          <h5 className="course-card-title">{title || 'Untitled Course'}</h5>

          <div className="course-card-teacher">
            <div className="course-card-avatar">
              {displayTeacher.charAt(0).toUpperCase()}
            </div>
            <div className="course-card-teacher-info">
              <div className="course-card-teacher-label">Instructor</div>
              <div className="course-card-teacher-name">{displayTeacher}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="course-card-footer">
            <div className="course-card-stats">
              <span>
                <i className="bi bi-people-fill text-primary me-1"></i>
                {enrolledCount || 0}
              </span>
              {rating > 0 && (
                <span>
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  {rating}
                </span>
              )}
            </div>
            <div className={`price-tag ${price === 0 || !price ? 'free-tag' : ''}`}>
              {displayPrice}
            </div>
          </div>
        </div>

      </Link>
    </div>
  );
};

export default CourseCard;
