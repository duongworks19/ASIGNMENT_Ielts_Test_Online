import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherTestService } from '../../services/teacherTestService';
import { teacherQuestionService } from '../../services/teacherQuestionService';
import { auditLogService } from '../../services/auditLogService';
import { countEmbeddedQuestions, matchesTestId } from '../../utils/testModel';

const skillIcon = {
  Reading: 'bi-book',
  Listening: 'bi-headphones',
  Writing: 'bi-pencil-square',
  Speaking: 'bi-mic',
};

const statusMeta = {
  published: { label: 'Published', icon: 'bi-patch-check-fill', className: 'status-published' },
  pending: { label: 'Waiting admin', icon: 'bi-hourglass-split', className: 'status-pending' },
  draft: { label: 'Draft', icon: 'bi-circle', className: 'status-draft' },
};

export default function TestListPage() {
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [testToAssign, setTestToAssign] = useState(null);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, testsData] = await Promise.all([
        teacherCourseService.getCourses(teacherId),
        teacherTestService.getTests(teacherId),
      ]);
      setCourses(coursesData);
      setTests(testsData);

      const questionGroups = await Promise.all(
        testsData.map((test) => teacherQuestionService.getQuestions(test.id))
      );
      setQuestions(questionGroups.flat());
    } catch (err) {
      setError('Cannot connect to the mock server to load IELTS tests.');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCourseTitle = useCallback((courseId) => {
    if (!courseId) return 'Free library';
    const course = courses.find((item) => String(item.id) === String(courseId));
    return course ? course.title : 'Unknown course';
  }, [courses]);

  const isTestLocked = (courseId) => {
    const course = courses.find((item) => String(item.id) === String(courseId));
    return course?.status === 'pending';
  };

  const getQuestionsCount = useCallback((test) => {
    const bankCount = questions.filter((question) => matchesTestId(question.testId, test.id)).length;
    return countEmbeddedQuestions(test) + bankCount;
  }, [questions]);

  const filteredTests = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return tests.filter((test) => {
      const matchSearch = !keyword || test.title?.toLowerCase().includes(keyword);
      const matchCourse = selectedCourseId ? String(test.courseId) === String(selectedCourseId) : true;
      const matchSkill = selectedSkill ? test.skill === selectedSkill : true;
      const matchMode = selectedMode ? test.testMode === selectedMode : true;
      return matchSearch && matchCourse && matchSkill && matchMode;
    }).sort((a, b) => {
      const statusRank = { pending: 0, draft: 1, published: 2 };
      const rankCompare = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (rankCompare !== 0) return rankCompare;
      return String(a.title).localeCompare(String(b.title));
    });
  }, [tests, searchQuery, selectedCourseId, selectedSkill, selectedMode]);

  const stats = useMemo(() => {
    const published = tests.filter((test) => test.status === 'published').length;
    const pending = tests.filter((test) => test.status === 'pending').length;
    const totalQuestions = tests.reduce((sum, test) => sum + getQuestionsCount(test), 0);
    const free = tests.filter((test) => test.testMode === 'free' || test.isFreePreview).length;
    return { published, pending, totalQuestions, free };
  }, [tests, getQuestionsCount]);

  const handleDeleteClick = (test) => {
    if (isTestLocked(test.courseId)) {
      toast.error('Cannot delete a test inside a course that is waiting for approval.');
      return;
    }
    setTestToDelete(test);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setWorking(true);
    try {
      const relatedQuestions = questions.filter((question) => matchesTestId(question.testId, testToDelete.id));
      for (const question of relatedQuestions) {
        await teacherQuestionService.deleteQuestion(question.id);
        await auditLogService.logAction('DELETE_QUESTION', { questionId: question.id, testId: testToDelete.id }, teacherId);
      }
      await teacherTestService.deleteTest(testToDelete.id);
      await auditLogService.logAction(
        'DELETE_TEST',
        { testId: testToDelete.id, title: testToDelete.title, courseId: testToDelete.courseId },
        teacherId
      );
      setTests((prev) => prev.filter((item) => item.id !== testToDelete.id));
      setQuestions((prev) => prev.filter((item) => !matchesTestId(item.testId, testToDelete.id)));
      toast.success('Test and related question-bank items deleted.');
      setShowDeleteModal(false);
      setTestToDelete(null);
    } catch (err) {
      toast.error('Delete failed.');
    } finally {
      setWorking(false);
    }
  };

  const handleTogglePublish = async (test) => {
    setWorking(true);
    try {
      let nextStatus = 'draft';
      if (test.status === 'draft') nextStatus = 'pending';
      else if (test.status === 'pending') nextStatus = 'draft';
      else if (test.status === 'published') nextStatus = 'draft';

      const updated = await teacherTestService.updateTest(test.id, { status: nextStatus, updatedAt: new Date().toISOString() });
      await auditLogService.logAction(
        nextStatus === 'pending' ? 'SUBMIT_TEST' : 'UNPUBLISH_TEST',
        { testId: test.id, title: test.title },
        teacherId
      );
      setTests((prev) => prev.map((item) => item.id === test.id ? { ...item, ...updated } : item));
      toast.success(nextStatus === 'pending' ? 'Sent to admin approval.' : 'Moved back to draft.');
    } catch (err) {
      toast.error('Cannot update test status.');
    } finally {
      setWorking(false);
    }
  };

  const openAssignModal = (test) => {
    setTestToAssign(test);
    setAssignCourseId(test.courseId || '');
    setShowAssignModal(true);
  };

  const handleAssignCourse = async () => {
    if (!testToAssign) return;
    setWorking(true);
    try {
      const payload = assignCourseId
        ? { testMode: 'course', courseId: assignCourseId, updatedAt: new Date().toISOString() }
        : { testMode: 'free', courseId: '', updatedAt: new Date().toISOString() };
      const updated = await teacherTestService.updateTest(testToAssign.id, payload);
      await auditLogService.logAction(
        'ASSIGN_TEST_COURSE',
        { testId: testToAssign.id, courseId: assignCourseId || null },
        teacherId
      );
      setTests((prev) => prev.map((item) => item.id === testToAssign.id ? { ...item, ...updated } : item));
      toast.success(assignCourseId ? 'Assigned to course.' : 'Moved to Free test.');
      setShowAssignModal(false);
      setTestToAssign(null);
    } catch (err) {
      toast.error('Assign course failed.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>


      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-patch-question-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Ngân hàng Đề thi</h1>
            <p className="tp-page-sub">Xây dựng, phê duyệt và xuất bản đề thi IELTS. Reading và Listening có thể chứa tới 40 câu hỏi trong một cấu hình đề duy nhất.</p>
          </div>
          <Link to="/teacher/tests/create" className="tp-btn-primary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-plus-circle-fill"></i> Tạo đề thi mới
          </Link>
        </div>
      </div>
      <div className="tp-main-content">
      <div className="container-fluid px-4">
        {/* --- APPROVAL FLOW --- */}
        <div className="tp-card-static p-4 mb-4">
          <h5 className="fw-bold mb-4 text-dark"><i className="bi bi-info-circle-fill text-primary me-2"></i>Quy trình duyệt Đề thi</h5>
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 text-center">
            <div className="flex-fill p-3 bg-light rounded border border-light">
              <i className="bi bi-pencil-square fs-2 text-primary mb-2 d-block"></i>
              <div className="fw-bold text-dark">Tutor creates</div>
              <div className="small text-secondary mt-1">Draft, question blocks, audio and task setup.</div>
            </div>
            <div className="d-flex align-items-center justify-content-center text-muted">
              <i className="bi bi-arrow-right fs-3 d-none d-md-block opacity-50"></i>
              <i className="bi bi-arrow-down fs-3 d-block d-md-none opacity-50"></i>
            </div>
            <div className="flex-fill p-3 bg-light rounded border border-light">
              <i className="bi bi-shield-check fs-2 text-warning mb-2 d-block"></i>
              <div className="fw-bold text-dark">Admin approves</div>
              <div className="small text-secondary mt-1">Pending requests become published tests.</div>
            </div>
            <div className="d-flex align-items-center justify-content-center text-muted">
              <i className="bi bi-arrow-right fs-3 d-none d-md-block opacity-50"></i>
              <i className="bi bi-arrow-down fs-3 d-block d-md-none opacity-50"></i>
            </div>
            <div className="flex-fill p-3 bg-light rounded border border-light">
              <i className="bi bi-mortarboard fs-2 text-success mb-2 d-block"></i>
              <div className="fw-bold text-dark">Student practices</div>
              <div className="small text-secondary mt-1">Only published free tests appear in /skills.</div>
            </div>
          </div>
        </div>

        {/* --- METRICS --- */}
        <Row className="g-3 mb-4">
          {[
            ['Published', stats.published, 'bi-patch-check-fill', 'tp-gradient-blue'],
            ['Waiting admin', stats.pending, 'bi-hourglass-split', 'tp-gradient-purple'],
            ['Free skill tests', stats.free, 'bi-unlock', 'tp-gradient-green'],
            ['Total questions', stats.totalQuestions, 'bi-list-check', 'tp-gradient-orange'],
          ].map(([label, value, icon, gradient]) => (
            <Col xl={3} md={6} key={label}>
              <div className="tp-stat-card">
                <div className={`tp-stat-icon ${gradient}`}>
                  <i className={`bi ${icon}`}></i>
                </div>
                <div>
                  <div className="tp-stat-label">{label}</div>
                  <div className="tp-stat-value">{value}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="studio-filter-card">
          <Form className="row g-3">
            <Col md={4}>
              <Form.Label>Search test</Form.Label>
              <Form.Control value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Type a test title..." />
            </Col>
            <Col md={3}>
              <Form.Label>Course</Form.Label>
              <Form.Select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Skill</Form.Label>
              <Form.Select value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)}>
                <option value="">All skills</option>
                <option value="Reading">Reading</option>
                <option value="Listening">Listening</option>
                <option value="Writing">Writing</option>
                <option value="Speaking">Speaking</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Mode</Form.Label>
              <Form.Select value={selectedMode} onChange={(event) => setSelectedMode(event.target.value)}>
                <option value="">All modes</option>
                <option value="free">Free</option>
                <option value="course">Course</option>
              </Form.Select>
            </Col>
          </Form>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-secondary">Loading IELTS test studio...</p>
          </div>
        ) : (
          <Card className="studio-table-card">
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Skill</th>
                  <th>Mode</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Questions</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, index) => {
                  const locked = isTestLocked(test.courseId);
                  const meta = statusMeta[test.status] || statusMeta.draft;
                  const currentCount = getQuestionsCount(test);
                  const total = Number(test.totalQuestions || 0);
                  const percent = total ? Math.min(100, Math.round((currentCount / total) * 100)) : 0;

                  return (
                    <tr key={test.id} className="studio-row" style={{ '--row-index': index }}>
                      <td className="test-title-cell">
                        <div className="fw-semibold text-dark">{test.title}</div>
                        <div className="small text-secondary mt-1">{test.durationMinutes} min · {test.bandScale}</div>
                      </td>
                      <td>
                        <span className="skill-pill">
                          <i className={`bi ${skillIcon[test.skill] || 'bi-card-text'}`}></i>
                          {test.skill}
                        </span>
                      </td>
                      <td>
                        <span className="mode-pill">
                          <i className={`bi ${test.testMode === 'free' ? 'bi-unlock' : 'bi-collection'}`}></i>
                          {test.testMode === 'free' ? 'Free' : 'Course'}
                        </span>
                      </td>
                      <td className="small text-secondary">{getCourseTitle(test.courseId)}</td>
                      <td>
                        <span className={`status-pill ${meta.className}`}>
                          <i className={`bi ${meta.icon}`}></i>
                          {meta.label}
                        </span>
                      </td>
                      <td className="small">{test.attemptLimit ? `${test.attemptLimit} times` : 'Unlimited'}</td>
                      <td>
                        <div className="question-meter">
                          <div className="fw-semibold">{currentCount} / {total}</div>
                          <div className="question-meter-track mt-2">
                            <div className="question-meter-fill" style={{ '--meter-width': `${percent}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="studio-actions">
                          <Button as={Link} to={`/teacher/tests/${test.id}/edit`} size="sm" variant="outline-secondary" disabled={locked} title="Edit test">
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClick(test)} disabled={locked || working} title="Delete test">
                            <i className="bi bi-trash3"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <i className="bi bi-search fs-1 d-block mb-3"></i>
                      No IELTS tests match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        )}

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Delete test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{testToDelete?.title}</strong> and related question-bank items?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={working}>
            {working ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Assign test to course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Course</Form.Label>
          <Form.Select value={assignCourseId} onChange={(event) => setAssignCourseId(event.target.value)}>
            <option value="">No course - keep as Free skill test</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title} ({course.status})</option>
            ))}
          </Form.Select>
          <div className="small text-secondary mt-3">
            Free published tests appear on the student skills page after admin approval.
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignCourse} disabled={working}>
            {working ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
  </div>
  );
}

