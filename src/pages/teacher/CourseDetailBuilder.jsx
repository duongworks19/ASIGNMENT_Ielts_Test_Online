import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Spinner, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherLessonService } from '../../services/teacherLessonService';
import { teacherTestService } from '../../services/teacherTestService';
import { teacherFlashcardService } from '../../services/teacherFlashcardService';
import { teacherApprovalService } from '../../services/teacherApprovalService';
import { auditLogService } from '../../services/auditLogService';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function CourseDetailBuilder() {
  const { id } = useParams(); // course ID
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unlinked lists for assign modal
  const [unlinkedTests, setUnlinkedTests] = useState([]);
  const [unlinkedDecks, setUnlinkedDecks] = useState([]);

  // Modal states
  const [showLessonPreviewModal, setShowLessonPreviewModal] = useState(false);
  const [lessonToPreview, setLessonToPreview] = useState(null);
  const [showDeleteLessonModal, setShowDeleteLessonModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  const [showAssignTestModal, setShowAssignTestModal] = useState(false);
  const [selectedTestToAssign, setSelectedTestToAssign] = useState('');
  const [showUnlinkTestModal, setShowUnlinkTestModal] = useState(false);
  const [testToUnlink, setTestToUnlink] = useState(null);

  const [showAssignDeckModal, setShowAssignDeckModal] = useState(false);
  const [selectedDeckToAssign, setSelectedDeckToAssign] = useState('');
  const [selectedDeckMode, setSelectedDeckMode] = useState('course');
  const [showUnlinkDeckModal, setShowUnlinkDeckModal] = useState(false);
  const [deckToUnlink, setDeckToUnlink] = useState(null);

  const [working, setWorking] = useState(false);

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch course details
      const courseData = await teacherCourseService.getCourseById(id);

      // Ownership guard
      if (courseData.teacherId !== teacherId) {
        setError('Bạn không có quyền quản lý khóa học này.');
        setLoading(false);
        return;
      }
      setCourse(courseData);

      // 2. Fetch associated lessons, tests and all decks/tests
      const [lessonsData, testsData, allDecks, allTests] = await Promise.all([
        teacherLessonService.getLessonsByCourse(id),
        teacherTestService.getTestsByCourse(id),
        teacherFlashcardService.getDecksByTeacher(teacherId),
        teacherTestService.getTests(teacherId)
      ]);

      setLessons(lessonsData.sort((a, b) => Number(a.order) - Number(b.order)));
      setTests(testsData);

      // Filter decks belonging to this course
      const courseDecks = allDecks.filter(d => d.courseId === id);
      setDecks(courseDecks);

      // Filter unlinked tests (tests with no courseId, or not this courseId)
      const availableTests = allTests.filter(t => !t.courseId || t.courseId === '');
      setUnlinkedTests(availableTests);

      // Filter unlinked decks
      const availableDecks = allDecks.filter(d => !d.courseId || d.courseId === '');
      setUnlinkedDecks(availableDecks);

    } catch (err) {
      setError('Không thể tải thông tin chi tiết khóa học. Vui lòng kết nối server.');
    } finally {
      setLoading(false);
    }
  }, [id, teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if course is pending approval
  const isLocked = course?.status === 'pending';

  // --- Revert Course Status Helper ---
  const handleRevertApprovedCourse = async () => {
    if (course && course.status === 'approved') {
      await teacherCourseService.updateCourse(course.id, { status: 'pending' });
      setCourse({ ...course, status: 'pending' });
      toast.success('Khóa học đã được hoàn về trạng thái Chờ duyệt!');
      await auditLogService.logAction(
        'REVERT_COURSE_STATUS',
        { courseId: course.id, reason: 'Course structure edited' },
        teacherId
      );
    }
  };

  // --- Submit Approval Request ---
  const handleSubmitApproval = async () => {
    if (isLocked) return;
    setWorking(true);
    try {
      const approvalData = {
        id: `req-${Date.now()}`,
        teacherId: teacherId,
        targetType: 'course',
        targetId: course.id,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Update DB
      await teacherApprovalService.submitApprovalRequest(approvalData);
      await teacherCourseService.updateCourse(course.id, { status: 'pending' });

      // Update UI state
      setCourse({ ...course, status: 'pending' });
      toast.success('Đã gửi yêu cầu phê duyệt khóa học thành công!');

      // Log Action
      await auditLogService.logAction(
        'SUBMIT_APPROVAL',
        { courseId: course.id, approvalId: approvalData.id },
        teacherId
      );
    } catch (err) {
      toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setWorking(false);
    }
  };

  // --- Lesson Handlers ---
  const handlePreviewLesson = (lesson) => {
    setLessonToPreview(lesson);
    setShowLessonPreviewModal(true);
  };

  const handleDeleteLesson = (lesson) => {
    if (isLocked) return;
    setLessonToDelete(lesson);
    setShowDeleteLessonModal(true);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setWorking(true);
    try {
      await teacherLessonService.deleteLesson(lessonToDelete.id);

      // Log Action
      await auditLogService.logAction(
        'DELETE_LESSON',
        { lessonId: lessonToDelete.id, title: lessonToDelete.title, courseId: id },
        teacherId
      );

      // Revert if approved
      await handleRevertApprovedCourse();

      setLessons(lessons.filter(l => l.id !== lessonToDelete.id));
      toast.success('Xóa bài học thành công!');
      setShowDeleteLessonModal(false);
      setLessonToDelete(null);
    } catch (err) {
      toast.error('Không thể xóa bài học.');
    } finally {
      setWorking(false);
    }
  };

  // --- Test Handlers ---
  const handleOpenAssignTest = () => {
    if (isLocked) return;
    setSelectedTestToAssign('');
    setShowAssignTestModal(true);
  };

  const handleConfirmAssignTest = async () => {
    if (!selectedTestToAssign) {
      toast.error('Vui lòng chọn đề thi.');
      return;
    }
    setWorking(true);
    try {
      // Link test to course
      await teacherTestService.updateTest(selectedTestToAssign, { courseId: id });

      // Log Action
      await auditLogService.logAction(
        'ASSIGN_TEST_TO_COURSE',
        { testId: selectedTestToAssign, courseId: id },
        teacherId
      );

      await handleRevertApprovedCourse();
      toast.success('Liên kết đề thi thành công!');
      setShowAssignTestModal(false);
      fetchData(); // Reload all data
    } catch (err) {
      toast.error('Liên kết đề thi thất bại.');
    } finally {
      setWorking(false);
    }
  };

  const handleUnlinkTest = (test) => {
    if (isLocked) return;
    setTestToUnlink(test);
    setShowUnlinkTestModal(true);
  };

  const handleConfirmUnlinkTest = async () => {
    if (!testToUnlink) return;
    setWorking(true);
    try {
      await teacherTestService.updateTest(testToUnlink.id, { courseId: '' });

      // Log Action
      await auditLogService.logAction(
        'UNLINK_TEST_FROM_COURSE',
        { testId: testToUnlink.id, courseId: id },
        teacherId
      );

      await handleRevertApprovedCourse();
      toast.success('Bỏ liên kết đề thi thành công!');
      setShowUnlinkTestModal(false);
      setTestToUnlink(null);
      fetchData();
    } catch (err) {
      toast.error('Bỏ liên kết thất bại.');
    } finally {
      setWorking(false);
    }
  };

  // --- Flashcard Handlers ---
  const handleOpenAssignDeck = () => {
    if (isLocked) return;
    setSelectedDeckToAssign('');
    setSelectedDeckMode('course');
    setShowAssignDeckModal(true);
  };

  const handleConfirmAssignDeck = async () => {
    if (!selectedDeckToAssign) {
      toast.error('Vui lòng chọn bộ từ vựng.');
      return;
    }
    setWorking(true);
    try {
      // Link deck to course
      await teacherFlashcardService.updateDeck(selectedDeckToAssign, {
        courseId: id,
        deckMode: selectedDeckMode
      });

      // Log Action
      await auditLogService.logAction(
        'ASSIGN_DECK_TO_COURSE',
        { deckId: selectedDeckToAssign, courseId: id, deckMode: selectedDeckMode },
        teacherId
      );

      await handleRevertApprovedCourse();
      toast.success('Liên kết bộ từ vựng thành công!');
      setShowAssignDeckModal(false);
      fetchData();
    } catch (err) {
      toast.error('Liên kết bộ từ vựng thất bại.');
    } finally {
      setWorking(false);
    }
  };

  const handleUnlinkDeck = (deck) => {
    if (isLocked) return;
    setDeckToUnlink(deck);
    setShowUnlinkDeckModal(true);
  };

  const handleConfirmUnlinkDeck = async () => {
    if (!deckToUnlink) return;
    setWorking(true);
    try {
      await teacherFlashcardService.updateDeck(deckToUnlink.id, {
        courseId: '',
        deckMode: 'free'
      });

      // Log Action
      await auditLogService.logAction(
        'UNLINK_DECK_FROM_COURSE',
        { deckId: deckToUnlink.id, courseId: id },
        teacherId
      );

      await handleRevertApprovedCourse();
      toast.success('Bỏ liên kết bộ từ vựng thành công!');
      setShowUnlinkDeckModal(false);
      setDeckToUnlink(null);
      fetchData();
    } catch (err) {
      toast.error('Bỏ liên kết thất bại.');
    } finally {
      setWorking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success-subtle" className="text-success rounded-pill px-3 py-1.5 text-uppercase">Approved</Badge>;
      case 'pending':
        return <Badge bg="warning-subtle" className="text-warning rounded-pill px-3 py-1.5 text-uppercase">Pending</Badge>;
      case 'rejected':
        return <Badge bg="danger-subtle" className="text-danger rounded-pill px-3 py-1.5 text-uppercase">Rejected</Badge>;
      default:
        return <Badge bg="secondary-subtle" className="text-secondary rounded-pill px-3 py-1.5 text-uppercase">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải thông tin chi tiết giáo trình...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tp-main-content">
        <div className="tp-error">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-4 mb-2"></i>
          <div>{error}</div>
          <Link to="/teacher/courses" className="btn btn-danger mt-3 rounded-pill px-4">
            Quay lại quản lý khóa học
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
            <div className="tp-page-badge"><i className="bi bi-gear-wide-connected"></i> Course Builder</div>
            <h1 className="tp-page-title">{course.title}</h1>
            <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
              <span className="small text-white-50 fw-bold text-uppercase">{course.skill} &bull; {course.level}</span>
              {getStatusBadge(course.status)}
            </div>
          </div>
          <Link to="/teacher/courses" className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-arrow-left"></i> Quay lại danh sách khóa học
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
        <div className="container-fluid px-4">

          {/* Main Tabs Area */}
          <div className="tp-card-static p-4">
            <Tabs defaultActiveKey="lessons" id="course-builder-tabs" className="mb-4 custom-tabs">

              {/* TAB 1: LESSONS */}
              <Tab eventKey="lessons" title={<span><i className="bi bi-collection-play me-2"></i>Bài học ({lessons.length})</span>}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Danh sách bài giảng</h5>
                  <Button
                    as={Link}
                    to={`/teacher/lessons/create?courseId=${id}`}
                    variant="primary"
                    className="rounded-pill px-4 small fw-semibold"
                    disabled={isLocked}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Thêm bài học mới
                  </Button>
                </div>

                {lessons.length === 0 ? (
                  <div className="text-center py-5 border rounded-3 bg-light">
                    <i className="bi bi-play-btn text-muted fs-1 mb-2"></i>
                    <h6 className="fw-semibold text-secondary">Chưa có bài học nào</h6>
                    <p className="text-muted small">Hãy thêm bài học mới để xây dựng chương trình học.</p>
                  </div>
                ) : (
                  <Table responsive hover className="align-middle mb-0 text-secondary table-nowrap border-light">
                    <thead className="bg-light text-dark fw-bold">
                      <tr>
                        <th style={{ width: '80px' }} className="text-center">Thứ tự</th>
                        <th>Tiêu đề bài giảng</th>
                        <th>Thời lượng</th>
                        <th>Nội dung / File âm thanh</th>
                        <th style={{ width: '120px' }} className="text-end px-4">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessons.map(lesson => (
                        <tr key={lesson.id} className="border-top border-light">
                          <td className="text-center fw-bold text-primary">{lesson.order}</td>
                          <td className="fw-bold text-dark">{lesson.title}</td>
                          <td>{lesson.durationMinutes} phút</td>
                          <td className="small text-truncate" style={{ maxWidth: '250px' }}>
                            {lesson.audioUrl ? (
                              <span className="text-success"><i className="bi bi-volume-up-fill me-1"></i> {lesson.audioUrl}</span>
                            ) : (
                              <span className="text-muted">{lesson.contentUrl || 'N/A'}</span>
                            )}
                          </td>
                          <td className="text-end px-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                variant="outline-primary"
                                onClick={() => handlePreviewLesson(lesson)}
                                className="py-1 px-2 border-0"
                                title="Xem trước bài giảng"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              <Button
                                as={Link}
                                to={`/teacher/lessons/${lesson.id}/edit`}
                                variant="outline-secondary"
                                className="py-1 px-2 border-0"
                                disabled={isLocked}
                                title="Sửa bài giảng"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => handleDeleteLesson(lesson)}
                                className="py-1 px-2 border-0"
                                disabled={isLocked}
                                title="Xóa bài giảng"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab>

              {/* TAB 2: PRACTICE TESTS */}
              <Tab eventKey="tests" title={<span><i className="bi bi-journal-check me-2"></i>Đề luyện tập ({tests.length})</span>}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Đề thi trong khóa học</h5>
                  <div className="d-flex gap-2">
                    <Button
                      onClick={handleOpenAssignTest}
                      variant="outline-primary"
                      className="rounded-pill px-3 small fw-semibold"
                      disabled={isLocked}
                    >
                      <i className="bi bi-link-45deg me-1"></i> Liên kết đề thi
                    </Button>
                    <Button
                      as={Link}
                      to={`/teacher/tests/create?courseId=${id}`}
                      variant="primary"
                      className="rounded-pill px-4 small fw-semibold"
                      disabled={isLocked}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Tạo đề thi mới
                    </Button>
                  </div>
                </div>

                {tests.length === 0 ? (
                  <div className="text-center py-5 border rounded-3 bg-light">
                    <i className="bi bi-file-earmark-check text-muted fs-1 mb-2"></i>
                    <h6 className="fw-semibold text-secondary">Chưa có đề thi nào liên kết</h6>
                    <p className="text-muted small">Hãy liên kết đề thi sẵn có hoặc tạo đề thi mới cho khóa học này.</p>
                  </div>
                ) : (
                  <Table responsive hover className="align-middle mb-0 text-secondary table-nowrap border-light">
                    <thead className="bg-light text-dark fw-bold">
                      <tr>
                        <th>Tiêu đề đề thi</th>
                        <th>Kỹ năng</th>
                        <th>Thời gian làm bài</th>
                        <th>Chế độ (Test Mode)</th>
                        <th style={{ width: '120px' }} className="text-end px-4">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map(test => (
                        <tr key={test.id} className="border-top border-light">
                          <td className="fw-bold text-dark">{test.title}</td>
                          <td>
                            <Badge bg="info" className="text-dark rounded-pill px-2.5">{test.skill}</Badge>
                          </td>
                          <td>{test.durationMinutes} phút</td>
                          <td>
                            <Badge bg="secondary" className="rounded-pill px-2.5 text-capitalize">{test.testMode}</Badge>
                          </td>
                          <td className="text-end px-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                as={Link}
                                to={`/teacher/tests/${test.id}/questions`}
                                variant="outline-primary"
                                className="py-1 px-2 border-0"
                                title="Ngân hàng câu hỏi"
                              >
                                <i className="bi bi-database-fill-gear"></i>
                              </Button>
                              <Button
                                as={Link}
                                to={`/teacher/tests/${test.id}/edit`}
                                variant="outline-secondary"
                                className="py-1 px-2 border-0"
                                disabled={isLocked}
                                title="Sửa đề thi"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => handleUnlinkTest(test)}
                                className="py-1 px-2 border-0"
                                disabled={isLocked}
                                title="Bỏ liên kết"
                              >
                                <i className="bi bi-link-45deg-slash text-danger"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab>

              {/* TAB 3: FLASHCARDS */}
              <Tab eventKey="flashcards" title={<span><i className="bi bi-card-text me-2"></i>Từ vựng ({decks.length})</span>}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Bộ từ vựng Flashcard</h5>
                  <div className="d-flex gap-2">
                    <Button
                      onClick={handleOpenAssignDeck}
                      variant="outline-primary"
                      className="rounded-pill px-3 small fw-semibold"
                      disabled={isLocked}
                    >
                      <i className="bi bi-link-45deg me-1"></i> Liên kết bộ từ
                    </Button>
                    <Button
                      as={Link}
                      to={`/teacher/flashcards?courseId=${id}`}
                      variant="primary"
                      className="rounded-pill px-4 small fw-semibold"
                      disabled={isLocked}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Tạo bộ từ mới
                    </Button>
                  </div>
                </div>

                {decks.length === 0 ? (
                  <div className="text-center py-5 border rounded-3 bg-light">
                    <i className="bi bi-card-text text-muted fs-1 mb-2"></i>
                    <h6 className="fw-semibold text-secondary">Chưa có bộ từ vựng nào liên kết</h6>
                    <p className="text-muted small">Hãy liên kết bộ từ vựng sẵn có hoặc tạo bộ từ vựng mới để phục vụ bài học.</p>
                  </div>
                ) : (
                  <Table responsive hover className="align-middle mb-0 text-secondary table-nowrap border-light">
                    <thead className="bg-light text-dark fw-bold">
                      <tr>
                        <th>Bộ từ vựng</th>
                        <th>Chế độ hiển thị (Deck Mode)</th>
                        <th>Trạng thái</th>
                        <th style={{ width: '120px' }} className="text-end px-4">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decks.map(deck => (
                        <tr key={deck.id} className="border-top border-light">
                          <td className="fw-bold text-dark">
                            <div>{deck.title}</div>
                            <div className="small text-muted">{deck.description || 'Không có mô tả'}</div>
                          </td>
                          <td>
                            {deck.deckMode === 'premium' ? (
                              <Badge bg="warning" text="dark" className="rounded-pill px-2.5">Premium</Badge>
                            ) : deck.deckMode === 'course' ? (
                              <Badge bg="primary" className="rounded-pill px-2.5">Course Only</Badge>
                            ) : (
                              <Badge bg="success" className="rounded-pill px-2.5">Free</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg={deck.status === 'published' ? 'success' : 'secondary'} className="rounded-pill px-2.5">
                              {deck.status}
                            </Badge>
                          </td>
                          <td className="text-end px-4">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                as={Link}
                                to={`/teacher/flashcards/${deck.id}`}
                                variant="outline-primary"
                                className="py-1 px-2 border-0"
                                title="Quản lý thẻ từ"
                              >
                                <i className="bi bi-gear-fill"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => handleUnlinkDeck(deck)}
                                className="py-1 px-2 border-0"
                                disabled={isLocked}
                                title="Bỏ liên kết"
                              >
                                <i className="bi bi-link-45deg-slash text-danger"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab>
            </Tabs>
          </div>

          {/* --- LESSON PREVIEW MODAL --- */}
          <Modal show={showLessonPreviewModal} onHide={() => setShowLessonPreviewModal(false)} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">
                <span className="text-primary small d-block mb-1">Xem trước bài giảng</span>
                {lessonToPreview?.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4">
              <div className="mb-3 d-flex gap-3 text-secondary small bg-light p-2.5 rounded-3">
                <div>
                  <strong>Thứ tự:</strong> Bài giảng số {lessonToPreview?.order}
                </div>
                <div>
                  <strong>Thời lượng:</strong> {lessonToPreview?.durationMinutes} phút
                </div>
              </div>

              {lessonToPreview?.contentUrl && (
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Nội dung bài học:</h6>
                  {getYouTubeId(lessonToPreview.contentUrl) ? (
                    <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(lessonToPreview.contentUrl)}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="p-3 bg-light border rounded text-secondary d-flex align-items-center gap-2">
                      <i className="bi bi-link-45deg fs-4 text-primary"></i>
                      <div className="overflow-hidden">
                        <div className="small fw-semibold text-truncate">{lessonToPreview.contentUrl}</div>
                        <a href={lessonToPreview.contentUrl} target="_blank" rel="noopener noreferrer" className="small text-decoration-none d-inline-flex align-items-center gap-1 mt-1">
                          Mở liên kết mới <i className="bi bi-box-arrow-up-right"></i>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lessonToPreview?.audioUrl && (
                <div>
                  <h6 className="fw-bold text-dark mb-2">Tệp âm thanh listening:</h6>
                  <div className="p-3 bg-light border rounded d-flex flex-column gap-2 shadow-sm">
                    <div className="d-flex align-items-center gap-2 text-success">
                      <i className="bi bi-music-note-beamed fs-4"></i>
                      <span className="small fw-semibold text-truncate">{lessonToPreview.audioUrl}</span>
                    </div>
                    <audio src={lessonToPreview.audioUrl} controls className="w-100 mt-2" />
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="secondary" onClick={() => setShowLessonPreviewModal(false)} className="fw-semibold px-4 rounded-pill">
                Đóng
              </Button>
            </Modal.Footer>
          </Modal>

          {/* --- DELETE LESSON MODAL --- */}
          <Modal show={showDeleteLessonModal} onHide={() => setShowDeleteLessonModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">Xác nhận xóa bài học</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              Bạn có chắc chắn muốn xóa bài học <strong className="text-danger">"{lessonToDelete?.title}"</strong>? Hành động này không thể hoàn tác.
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowDeleteLessonModal(false)} className="fw-semibold px-3 rounded-pill">Hủy</Button>
              <Button variant="danger" onClick={handleConfirmDeleteLesson} disabled={working} className="fw-semibold px-4 rounded-pill shadow-sm">
                {working ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* --- ASSIGN TEST MODAL --- */}
          <Modal show={showAssignTestModal} onHide={() => setShowAssignTestModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">Liên kết Đề thi sẵn có</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              <Form.Group>
                <Form.Label className="fw-semibold text-secondary">Chọn đề thi chưa được gắn khóa học nào:</Form.Label>
                <Form.Select
                  value={selectedTestToAssign}
                  onChange={(e) => setSelectedTestToAssign(e.target.value)}
                  className="py-2 px-3 border-gray"
                >
                  <option value="">-- Chọn đề thi --</option>
                  {unlinkedTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title} ({test.skill})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowAssignTestModal(false)} className="fw-semibold px-3 rounded-pill">Hủy</Button>
              <Button variant="primary" onClick={handleConfirmAssignTest} disabled={working} className="fw-semibold px-4 rounded-pill shadow-sm">
                {working ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* --- UNLINK TEST MODAL --- */}
          <Modal show={showUnlinkTestModal} onHide={() => setShowUnlinkTestModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">Bỏ liên kết Đề thi</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              Bạn có chắc muốn bỏ liên kết đề thi <strong>"{testToUnlink?.title}"</strong> ra khỏi khóa học hiện tại? Đề thi sẽ trở thành tự do (chưa gán khóa học).
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowUnlinkTestModal(false)} className="fw-semibold px-3 rounded-pill">Hủy</Button>
              <Button variant="danger" onClick={handleConfirmUnlinkTest} disabled={working} className="fw-semibold px-4 rounded-pill shadow-sm">
                {working ? 'Xác nhận gỡ...' : 'Bỏ liên kết'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* --- ASSIGN DECK MODAL --- */}
          <Modal show={showAssignDeckModal} onHide={() => setShowAssignDeckModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">Liên kết Bộ từ vựng</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Chọn bộ từ vựng tự do:</Form.Label>
                <Form.Select
                  value={selectedDeckToAssign}
                  onChange={(e) => setSelectedDeckToAssign(e.target.value)}
                  className="py-2 px-3 border-gray"
                >
                  <option value="">-- Chọn bộ từ vựng --</option>
                  {unlinkedDecks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label className="fw-semibold text-secondary">Chế độ hiển thị (Deck Mode):</Form.Label>
                <Form.Select
                  value={selectedDeckMode}
                  onChange={(e) => setSelectedDeckMode(e.target.value)}
                  className="py-2 px-3 border-gray"
                >
                  <option value="course">Course Only - Chỉ học viên khóa học này học được</option>
                  {course && course.isPremium && (
                    <option value="premium">Premium - Chỉ tài khoản đã thanh toán học được</option>
                  )}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowAssignDeckModal(false)} className="fw-semibold px-3 rounded-pill">Hủy</Button>
              <Button variant="primary" onClick={handleConfirmAssignDeck} disabled={working} className="fw-semibold px-4 rounded-pill shadow-sm">
                {working ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* --- UNLINK DECK MODAL --- */}
          <Modal show={showUnlinkDeckModal} onHide={() => setShowUnlinkDeckModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-dark">Bỏ liên kết Bộ từ vựng</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              Bạn có chắc muốn bỏ liên kết bộ từ vựng <strong>"{deckToUnlink?.title}"</strong> ra khỏi khóa học? Bộ từ vựng sẽ được chuyển về dạng tự do công khai.
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowUnlinkDeckModal(false)} className="fw-semibold px-3 rounded-pill">Hủy</Button>
              <Button variant="danger" onClick={handleConfirmUnlinkDeck} disabled={working} className="fw-semibold px-4 rounded-pill shadow-sm">
                {working ? 'Xác nhận gỡ...' : 'Bỏ liên kết'}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}
