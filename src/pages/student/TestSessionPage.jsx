import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProgressBar from '../../components/feature/quiz/ProgressBar';
import CountdownTimer from '../../components/feature/quiz/CountdownTimer';
import QuestionRenderer from '../../components/feature/quiz/QuestionRenderer';
import api from '../../services/api';
import { testService } from '../../services/testService';
import { testAttemptService } from '../../services/testAttemptService';
import { convertBandScore } from '../../utils/quizUtils';
import {
  buildSpeakingQuestions,
  buildConfigQuestions,
  buildWritingQuestions,
  calculateObjectiveScore,
  countAnswered,
  getAnswerValue,
  getPassageForQuestion,
  getSectionForQuestion,
  isAutoGradedSkill,
  normalizeTest,
  setAnswerValue,
} from '../../utils/testModel';

const skillColor = {
  Reading: '#0ea5e9',
  Listening: '#f59e0b',
  Writing: '#8b5cf6',
  Speaking: '#10b981',
};

const getSessionQuestions = (test, questionRecords) => {
  const normalized = normalizeTest(test);

  if (normalized.skill === 'Writing') {
    return buildWritingQuestions(normalized);
  }

  if (normalized.skill === 'Speaking' && questionRecords.length === 0) {
    return buildSpeakingQuestions(normalized);
  }

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

function QuestionMapItem({ number, isCurrent, isAnswered, isFlagged, onClick }) {
  let bg = '#fff';
  let color = '#333';
  let border = '1px solid #ccc';

  if (isCurrent) {
    border = '2px solid #000';
  } else if (isFlagged) {
    bg = '#fff3cd';
    border = '1px solid #ffc107';
  }

  const textDec = isAnswered ? 'underline' : 'none';

  return (
    <button
      type="button"
      onClick={onClick}
      className="d-flex align-items-center justify-content-center fw-bold"
      style={{
        width: 30,
        height: 30,
        border,
        background: bg,
        color,
        borderRadius: 0,
        fontSize: 13,
        cursor: 'pointer',
        textDecoration: textDec,
        textUnderlineOffset: '3px'
      }}
    >
      {number}
    </button>
  );
}

function AudioPlayer({ audioUrl, audioPolicy = 'allow-replay' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        })
        .catch(e => {
          console.warn("Autoplay blocked.", e);
          setIsPlaying(false);
        });
    }
  }, [audioUrl]);

  return (
    <div className="d-flex justify-content-end align-items-center py-1 px-3" style={{ background: '#fff' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
      {!isPlaying && !hasStarted && (
        <button 
          className="btn btn-sm btn-dark rounded-0 fw-bold shadow-sm" 
          onClick={() => {
            audioRef.current?.play();
            setHasStarted(true);
          }}
        >
          <i className="bi bi-play-fill me-1"></i> BẮT ĐẦU NGHE
        </button>
      )}
      {(isPlaying || hasStarted) && (
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-volume-up-fill text-dark" style={{ fontSize: '1.2rem' }}></i>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            style={{ width: '80px', cursor: 'pointer', accentColor: '#000' }}
            title="Điều chỉnh âm lượng"
          />
        </div>
      )}
    </div>
  );
}

function WritingAnswerPanel({ question, answer, onAnswer }) {
  const words = String(answer || '').trim() ? String(answer || '').trim().split(/\s+/).length : 0;
  const minWords = Number(question.minWords || (question.taskNumber === 1 ? 150 : 250));
  const imageUrl = question.imageUrl;

  return (
    <div
      className="d-flex flex-column flex-lg-row overflow-hidden shadow-sm bg-white"
      style={{ border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '600px' }}
    >
      <div
        className="p-4 d-flex flex-column"
        style={{
          flex: '0 0 50%',
          resize: 'horizontal',
          overflow: 'auto',
          borderRight: '2px solid #cbd5e1',
          background: '#fff'
        }}
      >
        <div className="fw-bold mb-3 pb-2 border-bottom text-dark" style={{ fontSize: '1.2rem' }}>
          Writing Task {question.taskNumber}
        </div>
        <p className="fw-normal text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.6' }}>
          {question.prompt || question.questionText}
        </p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Writing Task ${question.taskNumber}`}
            className="img-fluid mt-3"
            style={{ maxWidth: '100%', objectFit: 'contain' }}
          />
        )}
      </div>

      <div className="p-4 flex-grow-1 d-flex flex-column bg-white">
        <div className="fw-bold mb-3 text-dark pb-2 border-bottom" style={{ fontSize: '1.2rem' }}>
          Your Answer
        </div>
        <textarea
          className="form-control flex-grow-1 border-0 p-0"
          value={answer || ''}
          onChange={(event) => onAnswer(question.id, event.target.value)}
          placeholder="Type your answer here..."
          style={{ 
            boxShadow: 'none', 
            resize: 'none', 
            fontSize: '15px', 
            lineHeight: '1.8',
            color: '#1e293b'
          }}
        />
        <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
          <span className="text-muted small">Word count:</span>
          <span className={`fw-bold ${words >= minWords ? 'text-dark' : 'text-danger'}`} style={{ fontSize: '15px' }}>
            {words} {words >= minWords ? <i className="bi bi-check-circle-fill text-success ms-1"></i> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TestSessionPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isFreeRoute = location.pathname.startsWith('/free-tests');
  const reviewPath = (isFreeRoute ? `/free-tests/review/${attemptId}` : `/learning/tests/review/${attemptId}`) + location.search;

  const [attempt, setAttempt] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [expireAt, setExpireAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const attemptRes = await api.get(`/testAttempts/${attemptId}`);
        const attemptData = attemptRes.data;
        if (attemptData.status === 'completed') {
          navigate(reviewPath, { replace: true });
          return;
        }

        const testData = await testService.getTestById(attemptData.testId);
        const questionRecords = await testService.getQuestionsForTest(testData.id);
        const sessionQuestions = getSessionQuestions(testData, questionRecords);
        const expiresAt = attemptData.expiredAt
          ? new Date(attemptData.expiredAt).getTime()
          : new Date(attemptData.startTime).getTime() + Number(testData.durationMinutes || 60) * 60 * 1000;

        if (!ignore) {
          setAttempt(attemptData);
          setTestInfo(testData);
          setQuestions(sessionQuestions);
          setAnswers(attemptData.answers || {});
          setExpireAt(expiresAt);
        }
      } catch (err) {
        if (!ignore) setError('Không thể tải dữ liệu bài test.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [attemptId, navigate, reviewPath]);

  const normalizedTest = useMemo(() => (testInfo ? normalizeTest(testInfo) : null), [testInfo]);
  const skill = normalizedTest?.skill || 'Reading';
  const answeredCount = useMemo(() => countAnswered(answers, questions), [answers, questions]);
  const progressPercent = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const activeColor = skillColor[skill] || '#0ea5e9';

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => {
      const question = questions.find((item) => String(item.id) === String(questionId));
      if (!question) return prev;
      return setAnswerValue(prev, question, value);
    });
  }, [questions]);

  const handleToggleFlag = (index) => {
    setFlagged((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmitAttempt = useCallback(async () => {
    if (isSubmitting || !normalizedTest) return;
    setIsSubmitting(true);

    try {
      const submittedAt = new Date().toISOString();
      let scorePayload = { submittedAt };

      if (isAutoGradedSkill(normalizedTest.skill)) {
        const objectiveScore = calculateObjectiveScore(questions, answers);
        const band = convertBandScore(objectiveScore.correct, objectiveScore.total);
        scorePayload = {
          ...scorePayload,
          correctCount: objectiveScore.correct,
          totalScore: objectiveScore.total,
          score: band,
          overallBandScore: band,
        };
      } else {
        scorePayload = {
          ...scorePayload,
          gradingStatus: 'pending',
        };
      }

      // Sanitize answers to remove any leftover Base64 data (which causes Payload Too Large error)
      const sanitizedAnswers = {};
      for (const [qId, val] of Object.entries(answers)) {
        if (typeof val === 'string' && val.startsWith('data:audio/')) {
          sanitizedAnswers[qId] = ''; // discard raw base64 to save server
        } else {
          sanitizedAnswers[qId] = val;
        }
      }

      await testAttemptService.completeAttempt(attemptId, sanitizedAnswers, scorePayload);
      navigate(reviewPath);
    } catch (err) {
      setIsSubmitting(false);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    }
  }, [answers, attemptId, isSubmitting, navigate, normalizedTest, questions, reviewPath]);

  if (isLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" data-testid="session-loading">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
        <p className="text-muted fw-semibold">Đang chuẩn bị bài test...</p>
      </div>
    );
  }

  if (error || !attempt || !normalizedTest || questions.length === 0) {
    return (
      <div className="container mt-5" data-testid="session-error">
        <div className="alert alert-danger rounded-4 p-4 text-center shadow-sm">
          <h5 className="fw-bold">Không thể tải bài test</h5>
          <p className="mb-0">{error || 'Bài test này chưa có nội dung hợp lệ.'}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[Math.min(currentQuestionIndex, questions.length - 1)];

  const StickyHeader = () => (
    <div className="sticky-top bg-white border-bottom" style={{ zIndex: 1030 }}>
      <div className="container-fluid px-4" style={{ maxWidth: 1400 }}>
        <div className="d-flex align-items-center justify-content-between py-2 gap-3">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <span className="fw-bold text-dark fs-5" style={{ letterSpacing: '1px' }}>
              IELTS {skill}
            </span>
            <span className="text-secondary small fw-semibold text-truncate d-none d-md-inline border-start ps-3" style={{ maxWidth: 400 }}>
              {normalizedTest.title}
            </span>
          </div>
          {expireAt && (
            <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-0">
              <i className="bi bi-clock" style={{ color: '#000', fontSize: '18px' }} />
              <div className="fw-bold fs-5 text-dark" style={{ minWidth: 60, textAlign: 'center' }}>
                <CountdownTimer expireAt={expireAt} onExpire={handleSubmitAttempt} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SubmitButton = ({ block = false }) => (
    <button
      className={`btn fw-bold py-2 px-4 rounded-0`}
      style={{ background: isSubmitting ? '#ccc' : '#d92b2b', color: '#fff', border: 'none', letterSpacing: '0.5px' }}
      onClick={() => window.confirm('Bạn có chắc chắn muốn nộp bài?') && handleSubmitAttempt()}
      disabled={isSubmitting}
      data-testid="submit-btn"
    >
      {isSubmitting ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" />
          ...
        </>
      ) : (
        `SUBMIT TEST`
      )}
    </button>
  );

  const QuestionFooterMap = () => (
    <div className="bg-light border-top p-2 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ position: 'sticky', bottom: 0, zIndex: 1000 }}>
      <div className="d-flex align-items-center overflow-auto">
        <div className="d-flex align-items-center gap-1 flex-nowrap pb-1">
          {questions.map((question, index) => (
            <QuestionMapItem
              key={question.id}
              number={index + 1}
              isCurrent={currentQuestionIndex === index}
              isAnswered={Boolean(getAnswerValue(answers, question, index))}
              isFlagged={Boolean(flagged[index])}
              onClick={() => setCurrentQuestionIndex(index)}
            />
          ))}
        </div>
      </div>
      <div className="d-flex align-items-center gap-3 flex-shrink-0">
        <SubmitButton />
      </div>
    </div>
  );

  if (skill === 'Reading') {
    const passage = getPassageForQuestion(normalizedTest, currentQuestion);
    const passageMeta = (normalizedTest.testConfig?.passages || []).find((item) => item.id === currentQuestion.referenceId);

    return (
      <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} data-testid="session-page">
        <StickyHeader />
        <div className="container-fluid px-0 flex-grow-1 d-flex flex-column" style={{ maxWidth: 1800 }}>
          <div className="row g-0 flex-grow-1 h-100">
            <div className="col-12 col-lg-6 border-end d-flex flex-column" style={{ borderRightColor: '#ccc !important' }}>
              <div className="px-4 py-3 fw-bold bg-light text-dark border-bottom" style={{ fontSize: '1.1rem' }}>
                {passageMeta?.title || 'Reading Passage'}
              </div>
              <div className="px-4 py-4 flex-grow-1 overflow-auto bg-white" style={{ height: '0', paddingBottom: '100px' }}>
                <div style={{ lineHeight: 1.8, fontSize: 16, color: '#000', whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>
                  {passageMeta?.imageUrl && <img src={passageMeta.imageUrl} alt={passageMeta.title} className="img-fluid mb-4" />}
                  {passage || <span className="text-muted">Chưa có nội dung passage.</span>}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6 d-flex flex-column position-relative bg-white">
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-light">
                <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</div>
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQuestionIndex)}
                  className={`btn btn-sm px-3 fw-semibold border rounded-0 ${flagged[currentQuestionIndex] ? 'btn-warning text-dark' : 'btn-light'}`}
                >
                  Review
                </button>
              </div>
              <div className="p-4 p-md-5 flex-grow-1 overflow-auto" style={{ height: '0' }}>
                <QuestionRenderer
                  question={currentQuestion}
                  currentAnswer={getAnswerValue(answers, currentQuestion, currentQuestionIndex)}
                  onAnswer={handleAnswer}
                />
              </div>
              <div className="px-4 py-3 border-top d-flex justify-content-between bg-light">
                <button
                  className="btn btn-outline-dark px-4 py-2 fw-semibold rounded-0"
                  onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </button>
                <button
                  className="btn btn-dark px-4 py-2 fw-semibold rounded-0"
                  onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
        <QuestionFooterMap />
      </div>
    );
  }

  if (skill === 'Listening') {
    const configSections = normalizedTest.testConfig?.sections || [];
    const grouped = configSections.length
      ? configSections.map((section) => ({
        section,
        questions: questions.filter((question) => question.referenceId === section.id || question.section === section.title),
      })).filter((item) => item.questions.length > 0)
      : Array.from(new Set(questions.map((question) => question.section || question.referenceId || 'Section 1'))).map((name) => ({
        section: { id: name, title: name, instruction: '' },
        questions: questions.filter((question) => (question.section || question.referenceId || 'Section 1') === name),
      }));
    const audioPolicy = normalizedTest.testConfig?.audioPolicy || 'allow-replay';
    const globalAudioUrl = normalizedTest.testConfig?.audioUrl || normalizedTest.audioUrl;

    return (
      <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} data-testid="session-page">
        <StickyHeader />
        {globalAudioUrl ? (
          <div className="sticky-top bg-light border-bottom" style={{ zIndex: 1020, top: 57 }}>
            <div className="container" style={{ maxWidth: 1000 }}>
              <AudioPlayer audioUrl={globalAudioUrl} audioPolicy={audioPolicy} />
            </div>
          </div>
        ) : (
          <div className="alert alert-warning rounded-0 mb-0 text-center">Listening audio chưa được cấu hình.</div>
        )}
        <div className="container py-4 flex-grow-1" style={{ maxWidth: 1000 }}>
          <div className="d-flex flex-column gap-5">
            {grouped.map(({ section, questions: sectionQuestions }) => (
              <section key={section.id || section.title}>
                <div className="px-2 py-3 mb-4" style={{ background: '#fff', borderBottom: '2px solid #000' }}>
                  <div className="fw-bold text-dark" style={{ fontSize: 20 }}>{section.title || 'Listening Section'}</div>
                  {section.instruction && <p className="mb-0 mt-2 text-secondary fst-italic">{section.instruction}</p>}
                </div>
                {section.audioUrl && (
                  <div className="mb-4">
                    <AudioPlayer audioUrl={section.audioUrl} audioPolicy={audioPolicy} />
                  </div>
                )}
                <div className="row g-4">
                  {sectionQuestions.map((question) => {
                    const index = questions.findIndex((item) => item.id === question.id);
                    const answer = getAnswerValue(answers, question, index);
                    return (
                      <div className="col-12" key={question.id}>
                        <div className="bg-white px-3 py-2" style={{ border: 'none' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>Question {index + 1}</span>
                          </div>
                          <div className="p-0">
                            <QuestionRenderer question={question} currentAnswer={answer} onAnswer={handleAnswer} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
        <QuestionFooterMap />
      </div>
    );
  }

  if (skill === 'Writing') {
    return (
      <div style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} data-testid="session-page">
        <StickyHeader />
        <div className="container-fluid py-4 flex-grow-1 d-flex flex-column" style={{ maxWidth: 1600, paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div className="d-flex flex-column gap-5 mb-5 flex-grow-1">
            {questions.map((question, index) => (
              <WritingAnswerPanel
                key={question.id}
                question={question}
                answer={getAnswerValue(answers, question, index)}
                onAnswer={handleAnswer}
              />
            ))}
          </div>
        </div>
        <div className="border-top bg-white p-3 d-flex justify-content-between align-items-center" style={{ position: 'sticky', bottom: 0, zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="badge bg-light text-dark border p-2" style={{ fontSize: '13px' }}>
              <i className="bi bi-info-circle text-primary me-2"></i>
              IELTS Writing
            </div>
            <span className="text-muted small">Make sure you have completed both Task 1 and Task 2 before submitting.</span>
          </div>
          <div style={{ width: 200 }}>
            <SubmitButton block />
          </div>
        </div>
      </div>
    );
  }

  if (skill === 'Speaking') {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} data-testid="session-page">
        <StickyHeader />
        <div className="container py-5 flex-grow-1" style={{ maxWidth: 900 }}>
          <div className="rounded-4 p-4 mb-5 shadow-sm bg-white" style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
            <h5 className="fw-bold mb-2 text-dark">IELTS Speaking</h5>
            <p className="mb-0 text-secondary" style={{ fontSize: '15px' }}>
              Ensure your microphone is working properly. The test consists of 3 parts: Introduction, Long Turn (Cue Card), and Discussion.
            </p>
          </div>
          <div className="d-flex flex-column gap-5">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-4 overflow-hidden shadow-sm bg-white" style={{ border: '1px solid #e2e8f0' }}>
                <div className="px-4 py-3 border-bottom bg-light">
                  <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                    Part {question.part || index + 1}
                    {question.answerSeconds ? <span className="ms-2 badge bg-success fw-normal">~ {question.answerSeconds}s</span> : ''}
                  </div>
                </div>
                <div className="p-4 p-md-5">
                  <QuestionRenderer
                    question={question}
                    currentAnswer={getAnswerValue(answers, question, index)}
                    onAnswer={handleAnswer}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <QuestionFooterMap />
      </div>
    );
  }

  return (
    <div className="container mt-5" data-testid="session-page">
      <p>Kỹ năng chưa được hỗ trợ: {skill}</p>
    </div>
  );
}
