import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:9999';

const AttemptDetailPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttemptDetail = async () => {
      try {
        setLoading(true);
        // EARS[Event]: WHEN the Student selects a past test attempt, THE system SHALL display its detailed results.
        const res = await axios.get(`${API_URL}/testAttempts/${attemptId}`);
        setAttempt(res.data);
      } catch (err) {
        // EARS[Unwanted]: If the attempt does not exist or fetch fails, THE system SHALL display a Not Found error.
        setError('Attempt not found or network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchAttemptDetail();
    }
  }, [attemptId]);

  // EARS[State-driven]: WHILE data is loading, THE system SHALL display a spinner.
  if (loading) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status" data-testid="attempt-loading">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm border-0" role="alert" data-testid="attempt-error">
          <h4 className="alert-heading fw-bold mb-3">⚠️ Xảy ra lỗi</h4>
          <p>{error || 'Test attempt could not be found.'}</p>
          <hr />
          <button 
            className="btn btn-outline-danger px-4" 
            onClick={() => navigate('/learning/history')} 
            data-testid="btn-error-back"
          >
            &larr; Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header & Back Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bolder text-dark mb-0" style={{ letterSpacing: '-0.5px' }}>
          Test Result Details
        </h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/learning/history')}
          data-testid="btn-back"
        >
          &larr; Back to History
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="card-body p-4 p-md-5">
          <div className="row g-4 align-items-center">
            
            {/* Info Section */}
            <div className="col-12 col-md-8">
              <h3 className="fw-bold text-dark mb-2">{attempt.testTitle}</h3>
              <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                Skill: <strong className="text-dark">{attempt.skill}</strong> &nbsp;|&nbsp; 
                Date: <strong className="text-dark">{new Date(attempt.submittedAt).toLocaleDateString('en-GB')}</strong>
              </p>
              
              <div className="d-flex flex-wrap gap-3">
                <div className="bg-light rounded p-3 text-center border" style={{ minWidth: '120px' }}>
                  <span className="d-block text-muted mb-1 fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Time Spent
                  </span>
                  <span className="fw-bold text-dark fs-4">{Math.round((attempt.timeSpent || 0) / 60)} min</span>
                </div>
              </div>
            </div>

            {/* Score Badge Section */}
            <div className="col-12 col-md-4 text-md-end text-center mt-4 mt-md-0 d-flex justify-content-md-end justify-content-center">
              <div 
                className="text-center p-4 rounded-circle shadow-sm" 
                style={{ 
                  backgroundColor: '#f7f7f7', 
                  border: '5px solid #0052ff', 
                  width: '160px', 
                  height: '160px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center' 
                }}
              >
                <span className="d-block text-muted mb-1 fw-bold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Band Score
                </span>
                <span className="d-block fw-bolder" style={{ fontSize: '3rem', lineHeight: '1', color: '#0052ff' }}>
                  {attempt.overallBandScore || attempt.score || 'N/A'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center text-md-end mt-4">
        <button 
          className="btn btn-primary btn-lg fw-bold px-5 shadow-sm" 
          onClick={() => navigate(`/learning/lessons/${attempt.testId || attempt.id}`)}
          data-testid="btn-review"
        >
          Enter Review Mode <i className="bi bi-arrow-right-circle ms-2"></i>
        </button>
      </div>

    </div>
  );
};

export default AttemptDetailPage;
