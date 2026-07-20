import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { testService } from '../../services/testService';

const SKILLS = [
  {
    key: 'reading',
    name: 'Reading',
    icon: 'bi-book',
    variant: 'primary',
    time: '60 minutes',
    parts: '3 passages - 40 questions',
    desc: 'Academic reading passages with matching, completion, multiple choice, and True/False/Not Given.',
    tips: ['Skim the whole passage first.', 'Scan names, dates, and numbers.', 'Watch absolute words such as all, never, always.'],
  },
  {
    key: 'listening',
    name: 'Listening',
    icon: 'bi-headphones',
    variant: 'info',
    time: '30-40 minutes',
    parts: '4 sections - 40 questions',
    desc: 'Playable IELTS audio with form completion, map labelling, short answer, and multiple choice.',
    tips: ['Preview the question type.', 'Listen for synonyms.', 'Use the final corrected answer if speakers self-correct.'],
  },
  {
    key: 'writing',
    name: 'Writing',
    icon: 'bi-pencil-square',
    variant: 'success',
    time: '60 minutes',
    parts: 'Task 1 + Task 2',
    desc: 'Academic Task 1 visual report plus Task 2 essay with IELTS band criteria.',
    tips: ['Spend more time on Task 2.', 'Plan before writing.', 'Check grammar and cohesion in the final minutes.'],
  },
  {
    key: 'speaking',
    name: 'Speaking',
    icon: 'bi-mic',
    variant: 'warning',
    time: '11-14 minutes',
    parts: '3 interview parts',
    desc: 'Part 1 interview, Part 2 cue card, and Part 3 extended discussion prompts.',
    tips: ['Answer then extend with a reason.', 'Use natural linking phrases.', 'For Part 2, cover every cue-card bullet.'],
  },
];

const MINI_PASSAGE = {
  title: 'The Benefits of Reading Habits',
  paragraphs: [
    'Reading regularly has been shown to improve vocabulary and concentration. People who read for at least 30 minutes a day tend to have a wider range of words at their disposal.',
    'A study at the University of Sussex found that just six minutes of reading can lower stress levels by up to 68 percent, making it more effective than listening to music.',
    'Experts recommend a balanced reading diet that mixes challenging texts with lighter material.',
  ],
};

const MINI_QUESTIONS = [
  { id: 'q1', statement: "Reading for 30 minutes a day can widen a person's vocabulary.", answer: 'TRUE' },
  { id: 'q2', statement: 'Reading is more effective at reducing stress than listening to music.', answer: 'TRUE' },
  { id: 'q3', statement: 'The University of Sussex study lasted six months.', answer: 'NOT GIVEN' },
  { id: 'q4', statement: 'Experts suggest reading only light and entertaining content.', answer: 'FALSE' },
];

export default function SkillPractice() {
  const [activeSkill, setActiveSkill] = useState('reading');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [approvedTests, setApprovedTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    testService.getFreeTests()
      .then((data) => setApprovedTests(data))
      .catch(() => setApprovedTests([]))
      .finally(() => setLoadingTests(false));
  }, []);

  const selected = SKILLS.find((skill) => skill.key === activeSkill) || SKILLS[0];
  const filteredTests = approvedTests.filter((test) => String(test.skill || '').toLowerCase() === activeSkill);
  const score = useMemo(
    () => MINI_QUESTIONS.filter((question) => answers[question.id] === question.answer).length,
    [answers]
  );
  const allAnswered = MINI_QUESTIONS.every((question) => answers[question.id]);

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-controller"></i> Approved IELTS practice</div>
            <h1 className="tp-page-title">IELTS Skill Studio</h1>
            <p className="tp-page-sub">
              Học viên chỉ thấy các đề đã được admin chấp nhận. Mỗi đề bên dưới được tạo từ tutor workflow và đang published.
            </p>
          </div>
          <div className="d-none d-lg-block text-end bg-white bg-opacity-10 rounded-4 p-3 border border-white border-opacity-25 shadow-sm">
            <div className="small text-uppercase text-white-50 fw-bold">Live approved tests</div>
            <div className="display-5 fw-bold text-white">{approvedTests.length}</div>
            <div className="text-white-50 small">Linked from Teacher Test Builder</div>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4 py-4">
          <Row className="g-4 mb-5">
            {SKILLS.map((skill) => (
              <Col key={skill.key} sm={6} lg={3}>
                <Card
                  role="button"
                  className={`tp-card h-100 border-0 transition-all ${activeSkill === skill.key ? 'shadow-lg border-primary border-2' : ''}`}
                  style={{ cursor: 'pointer', transform: activeSkill === skill.key ? 'translateY(-4px)' : 'none' }}
                  onClick={() => {
                    setActiveSkill(skill.key);
                    setSubmitted(false);
                    setAnswers({});
                  }}
                >
                  <Card.Body className="p-4">
                    <div className={`bg-${skill.variant} bg-opacity-10 text-${skill.variant} rounded-circle d-flex align-items-center justify-content-center mb-4`} style={{ width: '48px', height: '48px' }}>
                      <i className={`bi ${skill.icon} fs-4`} />
                    </div>
                    <div className="small text-uppercase text-secondary fw-bold mb-1">{skill.time}</div>
                    <h3 className="fs-5 fw-bold mb-2 text-dark">{skill.name}</h3>
                    <p className="text-secondary small mb-3 flex-grow-1">{skill.desc}</p>
                    <div className="small fw-semibold text-dark"><i className="bi bi-card-list me-1"></i> {skill.parts}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Card className="tp-card border-0 mb-5 bg-white shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <Row className="g-4 align-items-center">
                <Col lg={4}>
                  <div className="d-flex align-items-center gap-4 border-end-lg pe-lg-4">
                    <div className={`bg-${selected.variant} text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm`} style={{ width: '64px', height: '64px' }}>
                      <i className={`bi ${selected.icon} fs-2`} />
                    </div>
                    <div>
                      <div className="small text-uppercase text-secondary fw-bold letter-spacing-1">Current skill</div>
                      <h2 className="h3 fw-bold mb-0 text-dark">{selected.name}</h2>
                    </div>
                  </div>
                </Col>
                <Col lg={8}>
                  <Row className="g-4">
                    {selected.tips.map((tip, index) => (
                      <Col md={4} key={tip}>
                        <div className="d-flex align-items-start gap-3">
                          <div className={`bg-${selected.variant} bg-opacity-10 text-${selected.variant} rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0`} style={{ width: '28px', height: '28px' }}>
                            {index + 1}
                          </div>
                          <p className="mb-0 small text-secondary fw-medium lh-base">{tip}</p>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-end gap-3 flex-wrap mb-4">
              <div>
                <Badge bg="success" className="mb-2 px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-shield-check me-1"></i> Admin approved</Badge>
                <h2 className="h3 fw-bold mb-2 text-dark">Đề tutor tạo đã được duyệt: {selected.name}</h2>
                <p className="text-secondary mb-0">Teacher tạo đề, admin approve, học viên nhìn thấy tại đây.</p>
              </div>
              <Button as={Link} to="/free-tests" variant="outline-primary" className="rounded-pill px-4 fw-medium bg-white shadow-sm">
                View all tests
              </Button>
            </div>

            <Row className="g-4">
              {loadingTests ? (
                <Col xs={12} className="text-center py-5">
                  <Spinner animation="border" variant={selected.variant} style={{ width: '3rem', height: '3rem' }} />
                </Col>
              ) : filteredTests.length === 0 ? (
                <Col xs={12}>
                  <Alert variant="info" className="text-center border-0 shadow-sm rounded-4 py-4 bg-white">
                    <i className="bi bi-info-circle fs-2 text-info mb-3 d-block"></i>
                    <h5 className="fw-bold text-dark">Chưa có đề published cho kỹ năng này</h5>
                    <p className="mb-0 text-secondary">Hãy gửi đề từ Teacher Test Builder và admin approve.</p>
                  </Alert>
                </Col>
              ) : (
                filteredTests.map((test) => (
                  <Col md={6} xl={4} key={test.id}>
                    <Card className="tp-card h-100 border-0 shadow-sm hover-lift">
                      <Card.Body className="d-flex flex-column p-4">
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                          <Badge bg={selected.variant} className="px-3 py-2 rounded-pill">{test.skill}</Badge>
                          <Badge bg="success" className="px-3 py-2 rounded-pill"><i className="bi bi-check-circle me-1"></i>Published</Badge>
                        </div>
                        <Card.Title as="h3" className="fs-5 fw-bold text-dark mb-3">{test.title}</Card.Title>
                        <p className="text-secondary small flex-grow-1 lh-base">{test.description || 'IELTS practice test created by tutor and approved by admin.'}</p>
                        <div className="d-flex gap-3 text-secondary small fw-medium mb-4 pb-3 border-bottom">
                          <span><i className="bi bi-clock me-1 text-primary" />{test.durationMinutes} min</span>
                          <span><i className="bi bi-list-check me-1 text-primary" />{test.totalQuestions} questions</span>
                        </div>
                        <Button as={Link} to={`/free-tests/${test.id}`} variant={selected.variant} className="w-100 fw-bold rounded-pill text-white shadow-sm">
                          Làm bài ngay
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </section>

          {activeSkill === 'reading' && (
            <section className="mt-5 pt-4 border-top">
              <div className="text-center mb-5">
                <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-lightning-charge-fill me-1"></i> Quick check</Badge>
                <h2 className="h3 fw-bold mb-2 text-dark">Reading mini quiz: True / False / Not Given</h2>
                <p className="text-secondary">Đọc đoạn văn ngắn dưới đây và trả lời câu hỏi</p>
              </div>
              <Row className="g-4">
                <Col lg={6}>
                  <Card className="tp-card border-0 shadow-sm h-100 bg-white">
                    <Card.Body className="p-4 p-xl-5">
                      <h3 className="h5 fw-bold mb-4 text-dark border-start border-4 border-primary ps-3">{MINI_PASSAGE.title}</h3>
                      {MINI_PASSAGE.paragraphs.map((paragraph, i) => (
                        <p key={i} className="text-secondary lh-lg mb-4">{paragraph}</p>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={6}>
                  <Card className="tp-card border-0 shadow-sm h-100 bg-light">
                    <Card.Body className="p-4 p-xl-5">
                      {MINI_QUESTIONS.map((question, index) => (
                        <div key={question.id} className="bg-white p-4 rounded-4 shadow-sm mb-3 border">
                          <p className="fw-semibold mb-3 text-dark">
                            <span className="text-primary me-2 fs-5">{index + 1}.</span>{question.statement}
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => {
                              const selectedAnswer = answers[question.id] === option;
                              const correct = submitted && option === question.answer;
                              const wrong = submitted && selectedAnswer && option !== question.answer;
                              return (
                                <Button
                                  key={option}
                                  size="sm"
                                  variant={correct ? 'success' : wrong ? 'danger' : selectedAnswer ? 'primary' : 'outline-secondary'}
                                  className={`rounded-pill px-4 py-2 fw-medium ${selectedAnswer ? 'shadow-sm' : ''}`}
                                  onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                                >
                                  {option}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 pt-3 text-center">
                        {!submitted ? (
                          <Button className="tp-btn-primary px-5 py-3 rounded-pill fw-bold w-100" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
                            <i className="bi bi-check2-circle me-2"></i>
                            {allAnswered ? 'Submit mini quiz' : 'Answer all questions to submit'}
                          </Button>
                        ) : (
                          <Alert variant={score >= 3 ? 'success' : 'warning'} className="mb-0 rounded-4 shadow-sm py-3 border-0">
                            <i className={`bi ${score >= 3 ? 'bi-emoji-smile-fill' : 'bi-emoji-frown-fill'} fs-4 d-block mb-2`}></i>
                            Kết quả: <strong className="fs-5">{score}/{MINI_QUESTIONS.length}</strong>
                          </Alert>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </section>
          )}
        </Container>
      </div>
    </div>
  );
}
