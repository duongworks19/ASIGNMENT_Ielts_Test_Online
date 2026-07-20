import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherTestService } from '../../services/teacherTestService';
import { teacherQuestionService } from '../../services/teacherQuestionService';
import { auditLogService } from '../../services/auditLogService';
import {
  buildDefaultTestConfig,
  normalizeTest,
  SKILL_DEFAULTS,
} from '../../utils/testModel';
import StepIndicator from './test-builder/StepIndicator';
import SkillTemplateSelector from './test-builder/SkillTemplateSelector';
import LiveChecklist from './test-builder/LiveChecklist';
import ReadingBuilder from './test-builder/ReadingBuilder';
import ListeningBuilder from './test-builder/ListeningBuilder';
import WritingBuilder from './test-builder/WritingBuilder';
import SpeakingBuilder from './test-builder/SpeakingBuilder';
import TestPreviewModal from './test-builder/TestPreviewModal';

const createInitialDraft = (teacherId) => ({
  title: '',
  description: '',
  skill: 'Reading',
  testMode: 'free',
  courseId: '',
  isFreePreview: false,
  status: 'draft',
  practiceMode: 'exam',
  attemptLimit: 3,
  requireLoginAfterLimit: true,
  durationMinutes: SKILL_DEFAULTS.Reading.durationMinutes,
  totalQuestions: SKILL_DEFAULTS.Reading.totalQuestions,
  bandScale: 'IELTS 0-9',
  teacherId,
  testConfig: buildDefaultTestConfig('Reading'),
});

export default function TestCreatePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId') || '';
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState(() => createInitialDraft(teacherId));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const normalizedDraft = useMemo(() => normalizeTest(draft), [draft]);
  const selectedCourse = courses.find((course) => String(course.id) === String(draft.courseId));
  const isCoursePending = draft.testMode === 'course' && selectedCourse?.status === 'pending';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const coursesData = await teacherCourseService.getCourses(teacherId);
        setCourses(coursesData);

          if (id) {
            const [testData, questionData] = await Promise.all([
              teacherTestService.getTestById(id),
              teacherQuestionService.getQuestions(id),
            ]);

            if (testData.teacherId && testData.teacherId !== teacherId) {
              setIsUnauthorized(true);
              setLoading(false);
              return;
            }

            setDraft({
              ...normalizeTest(testData),
              teacherId: testData.teacherId || teacherId,
            });
            setQuestions(questionData);
          } else if (queryCourseId) {
            setDraft(prev => ({
              ...prev,
              testMode: 'course',
              courseId: queryCourseId,
              attemptLimit: 0
            }));
          }
        } catch (error) {
          toast.error('Không thể tải dữ liệu đề thi.');
        } finally {
          setLoading(false);
        }
      }

      loadData();
    }, [id, teacherId, queryCourseId]);

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSkillChange = (skill) => {
    const defaults = SKILL_DEFAULTS[skill] || SKILL_DEFAULTS.Reading;
    updateDraft({
      skill,
      durationMinutes: defaults.durationMinutes,
      totalQuestions: defaults.totalQuestions,
      testConfig: buildDefaultTestConfig(skill),
    });
  };

  const validateDraft = () => {
    if (!draft.title.trim() || draft.title.trim().length < 5) {
      toast.error('Tiêu đề đề thi cần ít nhất 5 ký tự.');
      setStep(1);
      return false;
    }
    if (draft.testMode === 'course' && !draft.courseId) {
      toast.error('Vui lòng chọn khóa học hoặc chuyển test sang Free.');
      setStep(1);
      return false;
    }
    if (isCoursePending) {
      toast.error('Khóa học đang chờ duyệt. Không thể thêm/sửa đề thi.');
      return false;
    }
    if (draft.status === 'published') {
      const config = draft.testConfig || {};
      if (draft.skill === 'Reading' && !(config.passages || []).some((passage) => passage.content?.trim())) {
        toast.error('Reading test cần ít nhất một passage có nội dung trước khi publish.');
        setStep(2);
        return false;
      }
      if (draft.skill === 'Listening' && !(config.audioUrl || (config.sections || []).some((section) => section.audioUrl))) {
        toast.error('Listening test cần audio URL trước khi publish.');
        setStep(2);
        return false;
      }
      if (draft.skill === 'Writing' && (!config.task1?.prompt?.trim() || !config.task2?.prompt?.trim())) {
        toast.error('Writing test cần đủ prompt Task 1 và Task 2.');
        setStep(2);
        return false;
      }
      if (draft.skill === 'Speaking') {
        const part2 = (config.parts || []).find((part) => Number(part.partNumber) === 2);
        if (!part2?.cueCard?.trim()) {
          toast.error('Speaking test cần cue card cho Part 2.');
          setStep(2);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateDraft()) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        ...normalizedDraft,
        courseId: normalizedDraft.testMode === 'course' ? normalizedDraft.courseId : '',
        attemptLimit: normalizedDraft.testMode === 'free' || normalizedDraft.isFreePreview
          ? Number(normalizedDraft.attemptLimit || 3)
          : Number(normalizedDraft.attemptLimit || 0),
        teacherId,
        updatedAt: now,
        createdAt: normalizedDraft.createdAt || now,
      };

      let savedTest;
      if (id) {
        savedTest = await teacherTestService.updateTest(id, payload);
        await auditLogService.logAction(
          'UPDATE_TEST',
          { testId: id, title: payload.title, courseId: payload.courseId },
          teacherId
        );
      } else {
        savedTest = await teacherTestService.createTest(payload);
        await auditLogService.logAction(
          'CREATE_TEST',
          { testId: savedTest.id, title: payload.title, courseId: payload.courseId },
          teacherId
        );
      }

      if (selectedCourse?.status === 'approved' && payload.testMode === 'course') {
        await teacherCourseService.updateCourse(selectedCourse.id, { status: 'pending' });
        await auditLogService.logAction(
          'REVERT_COURSE_STATUS',
          { courseId: selectedCourse.id, reason: `Test ${savedTest.id} changed` },
          teacherId
        );
      }

      toast.success(id ? 'Đã cập nhật đề thi.' : 'Đã tạo đề thi.');
      navigate('/teacher/tests');
    } catch (error) {
      toast.error('Lưu đề thi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderBuilder = () => {
    const props = {
      value: draft.testConfig || buildDefaultTestConfig(draft.skill),
      onChange: (testConfig) => updateDraft({ testConfig }),
    };
    if (draft.skill === 'Listening') return <ListeningBuilder {...props} />;
    if (draft.skill === 'Writing') return <WritingBuilder {...props} />;
    if (draft.skill === 'Speaking') return <SpeakingBuilder {...props} />;
    return <ReadingBuilder {...props} />;
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải dữ liệu đề thi...</p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="tp-main-content">
        <div className="tp-error">
          <i className="bi bi-shield-slash fs-2 mb-2 d-block text-danger"></i>
          <div>Bạn không có quyền chỉnh sửa đề thi này.</div>
          <Link to="/teacher/tests" className="btn btn-danger mt-3 rounded-pill px-4">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-file-earmark-text"></i> IELTS Test</div>
            <h1 className="tp-page-title">{id ? 'Chỉnh sửa IELTS test' : 'Tạo IELTS test'}</h1>
            <p className="tp-page-sub">Tạo đề theo chuẩn format IELTS, publish free test hoặc gán vào khóa học.</p>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <Link to="/teacher/tests" className="tp-btn-secondary">
              <i className="bi bi-arrow-left"></i> Quay lại
            </Link>
            {id && (
              <Button as={Link} to={`/teacher/tests/${id}/questions`} variant="outline-light" className="tp-btn-secondary">
                <i className="bi bi-ui-checks-grid me-1"></i> Quản lý câu hỏi
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={submitting || isCoursePending}
              className="tp-btn-primary"
            >
              {submitting ? (
                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Đang lưu...</>
              ) : (
                <><i className="bi bi-cloud-arrow-up-fill me-1"></i> Lưu test</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">

      {isCoursePending && (
        <Alert variant="warning" className="border-0 shadow-sm">
          Khóa học đã chọn đang chờ duyệt. Bạn không thể sửa hoặc thêm test vào khóa học này.
        </Alert>
      )}

      <StepIndicator currentStep={step} onStepClick={setStep} />

      <Row className="g-4">
        <Col xl={9}>
          {step === 1 && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Thông tin cơ bản</h5>
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Label>Chọn template kỹ năng</Form.Label>
                    <SkillTemplateSelector value={draft.skill} onChange={handleSkillChange} />
                  </Col>
                  <Col md={8}>
                    <Form.Label>Tiêu đề test</Form.Label>
                    <Form.Control
                      value={draft.title}
                      onChange={(e) => updateDraft({ title: e.target.value })}
                      placeholder="IELTS Reading Practice Test 1"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={draft.status} onChange={(e) => updateDraft({ status: e.target.value })}>
                      <option value="draft">Draft (Nháp)</option>
                      <option value="pending">Pending (Gửi duyệt)</option>
                      {draft.status === 'published' && <option value="published">Published</option>}
                    </Form.Select>
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Mô tả ngắn</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={draft.description}
                      onChange={(e) => updateDraft({ description: e.target.value })}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Mode hiển thị</Form.Label>
                    <Form.Select
                      value={draft.testMode}
                      disabled={!!queryCourseId}
                      onChange={(e) => {
                        const testMode = e.target.value;
                        updateDraft({
                          testMode,
                          courseId: testMode === 'free' ? '' : draft.courseId,
                          attemptLimit: testMode === 'free' ? 3 : 0,
                        });
                      }}
                    >
                      <option value="free">Free test</option>
                      <option value="course">Course test</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label>Practice mode</Form.Label>
                    <Form.Select value={draft.practiceMode} onChange={(e) => updateDraft({ practiceMode: e.target.value })}>
                      <option value="exam">Exam</option>
                      <option value="practice">Practice</option>
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label>Attempt limit</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={draft.attemptLimit}
                      onChange={(e) => updateDraft({ attemptLimit: Number(e.target.value) })}
                    />
                  </Col>
                  {(draft.testMode === 'course' || !!queryCourseId) && (
                    <Col md={8}>
                      <Form.Label>Gán vào khóa học</Form.Label>
                      <Form.Select 
                        value={draft.courseId || ''} 
                        disabled={!!queryCourseId}
                        onChange={(e) => updateDraft({ courseId: e.target.value })}
                      >
                        <option value="">Chưa gán khóa học</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title} ({course.status})
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  )}
                  <Col md={4}>
                    <Form.Label>Duration minutes</Form.Label>
                    <Form.Control
                      type="number"
                      value={draft.durationMinutes}
                      onChange={(e) => updateDraft({ durationMinutes: Number(e.target.value) })}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Total questions</Form.Label>
                    <Form.Control
                      type="number"
                      value={draft.totalQuestions}
                      onChange={(e) => updateDraft({ totalQuestions: Number(e.target.value) })}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Band scale</Form.Label>
                    <Form.Select value={draft.bandScale} onChange={(e) => updateDraft({ bandScale: e.target.value })}>
                      <option value="IELTS 0-9">IELTS 0-9</option>
                      <option value="Score 0-100">Score 0-100</option>
                    </Form.Select>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end mt-4">
                  <Button onClick={() => setStep(2)}>Tiếp tục</Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">Content Builder: {draft.skill}</h5>
                    <p className="text-muted small mb-0">Nhập nội dung nền cho đề trước khi gắn câu hỏi.</p>
                  </div>
                  <Button variant="outline-secondary" onClick={() => setStep(1)}>Quay lại</Button>
                </div>
                {renderBuilder()}
                <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                  <Button variant="outline-info" onClick={() => setShowPreviewModal(true)} disabled={isCoursePending}>
                    <i className="bi bi-eye me-2"></i> Preview Test
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={submitting || isCoursePending}>
                    <i className="bi bi-check-circle me-2"></i> {submitting ? 'Đang xử lý...' : id ? 'Lưu thay đổi' : 'Submit for Approval'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col xl={3}>
          <LiveChecklist test={normalizedDraft} questionCount={questions.length} onGoToStep={setStep} />
        </Col>
      </Row>

      <TestPreviewModal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)} 
        draft={normalizedDraft} 
      />
      </Container></div></div>
  );
}
