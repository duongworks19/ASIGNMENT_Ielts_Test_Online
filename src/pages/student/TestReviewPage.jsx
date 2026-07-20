import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../../services/api';
import { testService } from '../../services/testService';
import { convertBandScore } from '../../utils/quizUtils';
import {
  buildSpeakingQuestions,
  buildConfigQuestions,
  buildWritingQuestions,
  calculateObjectiveScore,
  getAnswerValue,
  isAutoGradedSkill,
  isCorrectAnswer,
  normalizeTest,
} from '../../utils/testModel';

const skillConfig = {
  Reading: { color: '#0ea5e9', bg: '#e0f2fe', icon: 'bi-book' },
  Listening: { color: '#f59e0b', bg: '#fef3c7', icon: 'bi-headphones' },
  Writing: { color: '#8b5cf6', bg: '#ede9fe', icon: 'bi-pencil-square' },
  Speaking: { color: '#10b981', bg: '#d1fae5', icon: 'bi-mic' },
};

const getSessionQuestions = (test, questionRecords) => {
  const normalized = normalizeTest(test);
  if (normalized.skill === 'Writing') return buildWritingQuestions(normalized);
  if (normalized.skill === 'Speaking' && questionRecords.length === 0) return buildSpeakingQuestions(normalized);
  if (['Reading', 'Listening'].includes(normalized.skill)) {
    const embeddedQuestions = buildConfigQuestions(normalized);
    const bankQuestions = questionRecords.map((question, index) => ({
      ...question,
      skill: question.skill || normalized.skill,
      order: Number(question.order || embeddedQuestions.length + index + 1),
    }));
    return [...embeddedQuestions, ...bankQuestions];
  }
  return questionRecords.map((question, index) => ({
    ...question,
    skill: question.skill || normalized.skill,
    order: Number(question.order || index + 1),
  }));
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

function calcDuration(start, end) {
  if (!start || !end) return '-';
  const ms = new Date(end) - new Date(start);
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const seconds = Math.max(0, Math.floor((ms % 60000) / 1000));
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function ManualReviewCard({ question, index, studentAnswer }) {
  const isWriting = question.type === 'writing-task';
  const wordCount = studentAnswer ? String(studentAnswer).trim().split(/\s+/).length : 0;

  return (
    <div data-testid={`review-question-${question.id}`} className="rounded-4 overflow-hidden shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="px-4 py-3 fw-bold" style={{ background: isWriting ? '#faf5ff' : '#ecfdf5', color: isWriting ? '#6d28d9' : '#065f46' }}>
        {isWriting ? `Writing Task ${question.taskNumber || index + 1}` : `Speaking Part ${question.part || index + 1}`}
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="text-muted small text-uppercase fw-bold mb-2">Prompt</div>
          <div className="lh-lg" style={{ whiteSpace: 'pre-wrap' }}>{question.prompt || question.questionText}</div>
          {question.imageUrl && <img src={question.imageUrl} alt="Writing prompt" className="img-fluid rounded-3 border mt-3" />}
          {question.subPoints?.length > 0 && (
            <ul className="mt-3 mb-0">
              {question.subPoints.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
            </ul>
          )}
        </div>

        <div className="rounded-3 p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
            <span className="text-muted small text-uppercase fw-bold">Student answer</span>
            {isWriting && <span className="small fw-bold text-muted">{wordCount} words</span>}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {studentAnswer || <em className="text-muted">Chưa có câu trả lời.</em>}
          </div>
        </div>
      </div>
    </div>
  );
}

const ObjectiveReviewCard = ({ question, index, studentAnswer }) => {
  const answerKey = question.answer || question.correctAnswer || '';
  const isCorrect = (studentAnswer || '').toLowerCase() === answerKey.toLowerCase();
  const isSkipped = !studentAnswer || studentAnswer.trim() === '';
  
  const statusColor = isCorrect ? '#10b981' : isSkipped ? '#64748b' : '#ef4444';
  const statusBg = isCorrect ? '#f0fdf4' : isSkipped ? '#f8fafc' : '#fef2f2';
  const statusText = isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect';
  const statusIcon = isCorrect ? 'bi-check-circle-fill' : isSkipped ? 'bi-dash-circle-fill' : 'bi-x-circle-fill';

  return (
    <div className="card border-0 rounded-4 mb-4 overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
      <div className="card-header border-bottom-0 py-3 d-flex justify-content-between align-items-center" style={{ background: statusBg }}>
        <h6 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Question {index + 1}</h6>
        <div className="d-flex align-items-center fw-bold" style={{ color: statusColor, fontSize: 14 }}>
          <i className={`bi ${statusIcon} me-2 fs-5`}></i>
          {statusText}
        </div>
      </div>
      <div className="card-body p-4 pt-2">
        <div className="mb-4 text-dark fs-5 fw-medium lh-base">
          {question.text}
        </div>

        {question.type === 'multiple_choice' && question.options && (
          <div className="d-flex flex-column gap-2 mb-4">
            {question.options.map((opt, optionIndex) => {
              const label = typeof opt === 'object' ? opt.text : opt;
              const isRightChoice = label === answerKey;
              const isUserChoice = label === studentAnswer;
              
              let optBg = '#f8fafc';
              let optBorder = '#e2e8f0';
              let optColor = '#334155';
              let optIcon = null;

              if (isRightChoice) {
                optBg = '#f0fdf4';
                optBorder = '#10b981';
                optColor = '#065f46';
                optIcon = <i className="bi bi-check-circle-fill text-success fs-5"></i>;
              } else if (isUserChoice && !isRightChoice) {
                optBg = '#fef2f2';
                optBorder = '#ef4444';
                optColor = '#991b1b';
                optIcon = <i className="bi bi-x-circle-fill text-danger fs-5"></i>;
              }

              return (
                <div key={optionIndex} className="d-flex align-items-center p-3 rounded-3 gap-3 transition-all" 
                     style={{ background: optBg, border: `1px solid ${optBorder}`, color: optColor }}>
                  <div className="fw-bold d-flex justify-content-center align-items-center rounded-circle bg-white shadow-sm" 
                       style={{ width: 32, height: 32, flexShrink: 0, color: '#64748b' }}>
                    {String.fromCharCode(65 + optionIndex)}
                  </div>
                  <div style={{ flex: 1, fontSize: 15 }}>{label}</div>
                  {optIcon && <div style={{ flexShrink: 0 }}>{optIcon}</div>}
                </div>
              );
            })}
          </div>
        )}

        {question.type !== 'multiple_choice' && (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 h-100" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="text-muted small text-uppercase fw-bold mb-2">Your Answer</div>
                <div className={`fw-semibold fs-6 ${!studentAnswer ? 'text-muted font-monospace' : (isCorrect ? 'text-success' : 'text-danger')}`}>
                  {studentAnswer || 'No answer provided'}
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-3 rounded-3 h-100" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="text-success small text-uppercase fw-bold mb-2">Correct Answer</div>
                <div className="fw-bold fs-6 text-success">
                  {answerKey}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TestReviewPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const isFreeRoute = location.pathname.startsWith('/free-tests');
  const isEmbed = new URLSearchParams(location.search).get("embed") === "true";

  const [attempt, setAttempt] = useState(null);
  const [testDetail, setTestDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const attemptRes = await api.get(`/testAttempts/${attemptId}`);
        const attemptData = attemptRes.data;
        const testData = await testService.getTestById(attemptData.testId);
        const questionRecords = await testService.getQuestionsForTest(testData.id);
        const sessionQuestions = getSessionQuestions(testData, questionRecords);

        if (!ignore) {
          setAttempt(attemptData);
          setTestDetail(testData);
          setQuestions(sessionQuestions);
        }
      } catch (err) {
        if (!ignore) setError('Không thể tải kết quả bài làm.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [attemptId]);

  const normalizedTest = useMemo(() => (testDetail ? normalizeTest(testDetail) : null), [testDetail]);
  const autoGraded = normalizedTest ? isAutoGradedSkill(normalizedTest.skill) : false;
  const scoreData = useMemo(() => {
    if (!autoGraded) return { correct: 0, total: questions.length, band: 0 };
    const score = calculateObjectiveScore(questions, attempt?.answers || {});
    return { ...score, band: convertBandScore(score.correct, score.total) };
  }, [attempt, autoGraded, questions]);

  if (isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }} data-testid="review-loading">
        <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#1b4332' }} role="status" />
        <p className="text-muted fw-semibold">Đang tải kết quả...</p>
      </div>
    );
  }

  if (error || !attempt || !normalizedTest) {
    return (
      <div className="container mt-5" data-testid="review-error">
        <div className="alert alert-danger rounded-4 p-4 text-center">
          {error || 'Không tìm thấy kết quả bài làm.'}
          <br />
          {!isEmbed && <Link to={isFreeRoute ? '/courses' : '/learning/tests'} className="btn btn-outline-danger mt-3 rounded-pill">Quay lại</Link>}
        </div>
      </div>
    );
  }

  const sk = skillConfig[normalizedTest.skill] || skillConfig.Reading;
  const listPath = isFreeRoute ? '/courses' : '/learning/tests';
  const retakePath = (isFreeRoute ? `/free-tests/${normalizedTest.id}` : `/learning/tests/${normalizedTest.id}`) + location.search;
  const percentage = scoreData.total ? Math.round((scoreData.correct / scoreData.total) * 100) : 0;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }} data-testid="review-page">
      <div style={{ background: 'linear-gradient(120deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <div className="container py-4">
          {!isEmbed && (
            <nav aria-label="breadcrumb" className="mb-3">
              <ol className="breadcrumb mb-0" style={{ fontSize: 13 }}>
                <li className="breadcrumb-item">
                  <Link to={listPath} className="text-decoration-none" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {isFreeRoute ? 'Tài nguyên miễn phí' : 'Danh sách bài test'}
                  </Link>
                </li>
                <li className="breadcrumb-item active" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Kết quả
                </li>
              </ol>
            </nav>
          )}

          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: sk.bg, color: sk.color }}>
              <i className={`bi ${sk.icon}`} />
            </span>
            <div>
              <h1 className="fw-bold text-white mb-0" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)' }}>{normalizedTest.title}</h1>
              <span className="badge mt-1 px-3 py-1" style={{ background: sk.bg, color: sk.color, borderRadius: 20 }}>{normalizedTest.skill}</span>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-4 mt-3 pb-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            <span><strong className="text-white">Bắt đầu:</strong> {formatDate(attempt.startTime)}</span>
            <span><strong className="text-white">Hoàn thành:</strong> {formatDate(attempt.completedAt || attempt.submittedAt)}</span>
            <span><strong className="text-white">Thời gian:</strong> {calcDuration(attempt.startTime, attempt.completedAt || attempt.submittedAt)}</span>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {attempt.gradingStatus === 'graded' || attempt.status === 'graded' || autoGraded ? (
          <div className="row g-4 mb-5">
            {(autoGraded ? [
              { title: 'Tỷ lệ đúng', value: `${percentage}%`, sub: 'Accuracy', color: '#3b82f6', bg: '#eff6ff', icon: 'bi-percent' },
              { title: 'Câu đúng', value: `${scoreData.correct}/${scoreData.total}`, sub: 'Correct Answers', color: '#10b981', bg: '#f0fdf4', icon: 'bi-check2-circle' },
              { title: 'Band Score', value: scoreData.band.toFixed(1), sub: 'Overall Band', color: '#8b5cf6', bg: '#f5f3ff', icon: 'bi-award-fill' },
              { title: 'Trạng thái', value: 'Hoàn thành', sub: normalizedTest.skill, color: '#f59e0b', bg: '#fffbeb', icon: 'bi-patch-check-fill' }
            ] : [
              { title: 'Kỹ năng', value: normalizedTest.skill, sub: 'Skill Tested', color: '#3b82f6', bg: '#eff6ff', icon: normalizedTest.skill === 'Speaking' ? 'bi-mic' : 'bi-pencil-square' },
              { title: 'Tiêu chí chấm', value: '4', sub: 'IELTS Criteria', color: '#10b981', bg: '#f0fdf4', icon: 'bi-list-check' },
              { title: 'Band Score', value: attempt.overallBandScore !== undefined ? Number(attempt.overallBandScore).toFixed(1) : 'N/A', sub: 'Overall Band', color: '#8b5cf6', bg: '#f5f3ff', icon: 'bi-award-fill' },
              { title: 'Trạng thái', value: 'Đã chấm', sub: 'Graded', color: '#f59e0b', bg: '#fffbeb', icon: 'bi-patch-check-fill' }
            ]).map((stat, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="rounded-4 p-4 text-center h-100 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.1, color: stat.color }}>
                    <i className={`bi ${stat.icon}`} style={{ fontSize: '80px' }}></i>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
                    <div className="fw-bold mt-2 text-dark">{stat.title}</div>
                    <div className="text-muted small text-uppercase fw-semibold">{stat.sub}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12 mt-4">
              <div className="p-4 rounded-4 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32, background: '#eff6ff', color: '#3b82f6' }}>
                    <i className="bi bi-chat-left-text-fill"></i>
                  </div>
                  <div className="fw-bold text-dark fs-5">Nhận xét từ hệ thống / Giáo viên:</div>
                </div>

                {attempt.criteriaScores && (
                  <div className="row g-3 mb-4 mt-1 mx-2 py-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="col-6 col-md-3 text-center">
                      <div className="text-muted small fw-bold text-uppercase">{normalizedTest.skill === 'Speaking' ? 'FC (Fluency)' : 'TA/TR (Task)'}</div>
                      <div className="fs-4 fw-bold" style={{ color: '#1b4332' }}>{attempt.criteriaScores.C1}</div>
                    </div>
                    <div className="col-6 col-md-3 text-center" style={{ borderLeft: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-bold text-uppercase">{normalizedTest.skill === 'Speaking' ? 'LR (Lexical)' : 'CC (Coherence)'}</div>
                      <div className="fs-4 fw-bold" style={{ color: '#1b4332' }}>{attempt.criteriaScores.C2}</div>
                    </div>
                    <div className="col-6 col-md-3 text-center" style={{ borderLeft: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-bold text-uppercase">GRA (Grammar)</div>
                      <div className="fs-4 fw-bold" style={{ color: '#1b4332' }}>{attempt.criteriaScores.C3}</div>
                    </div>
                    <div className="col-6 col-md-3 text-center" style={{ borderLeft: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-bold text-uppercase">{normalizedTest.skill === 'Speaking' ? 'PR (Pronun.)' : 'LR (Lexical)'}</div>
                      <div className="fs-4 fw-bold" style={{ color: '#1b4332' }}>{attempt.criteriaScores.C4}</div>
                    </div>
                  </div>
                )}

                <div className="text-secondary lh-lg ms-4 ps-2" style={{ whiteSpace: 'pre-wrap', borderLeft: '3px solid #e2e8f0' }}>
                  {attempt.feedback || 'Bạn đã hoàn thành bài thi. Hãy xem kỹ lại các câu sai ở bên dưới để rút kinh nghiệm cho lần sau nhé!'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4 mb-5">
            <div className="col-12 col-md-4">
              <div className="rounded-4 p-4 text-center h-100 bg-white" style={{ border: '1px solid #f59e0b', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: 40, color: '#d97706' }} />
                <div className="fw-bold mt-3 fs-5" style={{ color: '#d97706' }}>Chờ giáo viên chấm</div>
                <div className="text-muted small mt-1">Bài thi Writing/Speaking cần feedback thủ công</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="rounded-4 p-4 text-center h-100 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#94a3b8', lineHeight: 1 }}>4</div>
                <div className="text-muted mt-2 fw-bold text-uppercase">Tiêu chí chấm IELTS</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="rounded-4 p-4 text-center h-100 bg-white" style={{ border: `1px solid ${sk.color}40`, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <i className={`bi ${sk.icon}`} style={{ fontSize: 40, color: sk.color }} />
                <div className="fw-bold mt-3 fs-5" style={{ color: sk.color }}>Đã nộp bài</div>
                <div className="text-muted small mt-1">{normalizedTest.skill}</div>
              </div>
            </div>
          </div>
        )}

        <h4 className="fw-bold text-dark mb-4">Chi tiết bài làm</h4>
        <div className="d-flex flex-column gap-4">
          {questions.map((question, index) => {
            const studentAnswer = getAnswerValue(attempt.answers || {}, question, index);
            return autoGraded ? (
              <ObjectiveReviewCard key={question.id} question={question} index={index} studentAnswer={studentAnswer} />
            ) : (
              <ManualReviewCard key={question.id} question={question} index={index} studentAnswer={studentAnswer} />
            );
          })}
        </div>

        <div className="d-flex justify-content-center gap-3 mt-5 pb-5 flex-wrap">
          {!isEmbed && (
            <Link to={listPath} className="btn fw-bold px-5 py-3 rounded-pill" style={{ background: '#1b4332', color: '#fff' }}>
              Quay lại danh sách
            </Link>
          )}
          <Link to={retakePath} className="btn fw-bold px-5 py-3 rounded-pill" style={{ background: '#fff', color: '#1b4332', border: '2px solid #1b4332' }}>
            Làm lại
          </Link>
        </div>
      </div>
    </div>
  );
}
