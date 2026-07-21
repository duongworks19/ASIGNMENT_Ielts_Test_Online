import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Container, Col, Card, Button, Form, Table, Modal, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherLessonService } from '../../services/teacherLessonService';
import { auditLogService } from '../../services/auditLogService';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function LessonListPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId') || '';

  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Pre-select course based on path parameter or search parameter
  useEffect(() => {
    const initialCourseId = id || queryCourseId;
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [id, queryCourseId]);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [lessonToPreview, setLessonToPreview] = useState(null);

  const handlePreviewClick = (lesson) => {
    setLessonToPreview(lesson);
    setShowPreviewModal(true);
  };

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, lessonsData] = await Promise.all([
        teacherCourseService.getCourses(teacherId),
        teacherLessonService.getLessons(teacherId)
      ]);
      setCourses(coursesData);
      setLessons(lessonsData);
    } catch (err) {
      // EARS[Unwanted]: WHERE server connections fail, THE system SHALL display an error message
      setError('Không thể kết nối đến máy chủ để tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (lesson) => {
    const matchedCourse = courses.find(c => c.id === lesson.courseId);
    // EARS[Unwanted]: Chặn xóa nếu khóa học chứa bài học có trạng thái pending
    if (matchedCourse?.status === 'pending') {
      toast.error('Không thể xóa bài học thuộc khóa học đang chờ duyệt.');
      return;
    }
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;
    setDeleting(true);
    try {
      await teacherLessonService.deleteLesson(lessonToDelete.id);
      
      // EARS[Ubiquitous]: Mọi thao tác thay đổi dữ liệu PHẢI gửi kèm request ghi nhận lịch sử hoạt động vào auditLogs
      await auditLogService.logAction(
        'DELETE_LESSON',
        { lessonId: lessonToDelete.id, title: lessonToDelete.title, courseId: lessonToDelete.courseId },
        teacherId
      );

      setLessons(lessons.filter(l => l.id !== lessonToDelete.id));
      toast.success('Xóa bài học thành công!');
      setShowDeleteModal(false);
      setLessonToDelete(null);
    } catch (err) {
      toast.error('Xóa bài học thất bại. Vui lòng thử lại sau.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to map course name
  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Khóa học không xác định';
  };

  // Helper to check if a lesson is locked due to pending course status
  const isLessonLocked = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.status === 'pending';
  };

  // Filtering
  const filteredLessons = lessons.filter(lesson => {
    const matchSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCourse = selectedCourseId ? lesson.courseId === selectedCourseId : true;
    return matchSearch && matchCourse;
  });

  // Sort lessons: group by course title, then sort by order ascending
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const titleA = getCourseTitle(a.courseId);
    const titleB = getCourseTitle(b.courseId);
    if (titleA !== titleB) {
      return titleA.localeCompare(titleB);
    }
    return Number(a.order) - Number(b.order);
  });

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      {/* ── PAGE HEADER ── */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-file-earmark-text-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Quản lý Giáo trình &amp; Bài học</h1>
            <p className="tp-page-sub">Theo dõi, chỉnh sửa thứ tự bài giảng và thời lượng bài học.</p>
          </div>
          <Link
            to={selectedCourseId ? `/teacher/lessons/create?courseId=${selectedCourseId}` : "/teacher/lessons/create"}
            className="tp-btn-primary"
            style={{ alignSelf: 'flex-end' }}
          >
            <i className="bi bi-plus-circle-fill"></i> Thêm bài học mới
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
      <Container fluid="xxl" className="px-4">
      {error && <div className="tp-error mb-4"><i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i><div className="text-secondary">{error}</div></div>}

      {/* ── FILTER BAR ── */}
      <div className="tp-filter-bar">
        <Form className="row g-3">
          <Col md={8}>
            <Form.Group controlId="search">
              <Form.Label className="fw-semibold text-secondary">Tìm kiếm bài học</Form.Label>
              <Form.Control type="text" placeholder="Nhập tiêu đề bài học..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="shadow-none" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="courseFilter">
              <Form.Label className="fw-semibold text-secondary">Lọc theo khóa học</Form.Label>
              <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="shadow-none">
                <option value="">Tất cả khóa học</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title} ({course.status})</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Form>
      </div>

      {/* Lessons Table */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="primary" className="me-2" />
          <span className="text-secondary fw-semibold">Đang tải danh sách bài học...</span>
        </div>
      ) : sortedLessons.length === 0 ? (
        <div className="tp-card-static">
          <div className="tp-empty">
            <div className="tp-empty-icon"><i className="bi bi-collection-play"></i></div>
            <div className="tp-empty-title">Không tìm thấy bài học nào</div>
            <p className="tp-empty-sub">Hãy tạo bài học mới hoặc thay đổi bộ lọc tìm kiếm phía trên.</p>
          </div>
        </div>
      ) : (
        <div className="tp-table-wrapper">
          <table className="tp-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Thứ tự</th>
                <th>Tiêu đề bài học</th>
                <th>Khóa học</th>
                <th style={{ width: '120px' }}>Thời lượng</th>
                <th>Nội dung / File âm thanh</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedLessons.map(lesson => {
                const locked = isLessonLocked(lesson.courseId);
                return (
                  <tr key={lesson.id} className="border-top border-light">
                    <td className="px-4 py-3 text-center fw-semibold text-primary">
                      {lesson.order}
                    </td>
                    <td className="py-3 fw-bold text-dark">
                      {lesson.title}
                    </td>
                    <td className="py-3 small">
                      {getCourseTitle(lesson.courseId)}
                    </td>
                    <td className="py-3">
                      {lesson.durationMinutes} phút
                    </td>
                    <td className="py-3 small text-truncate" style={{ maxWidth: '250px' }}>
                      {lesson.audioUrl ? (
                        <span className="d-flex align-items-center gap-1 text-success">
                          <i className="bi bi-volume-up-fill"></i> {lesson.audioUrl}
                        </span>
                      ) : (
                        <span className="text-muted">{lesson.contentUrl || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button 
                          variant="outline-primary"
                          onClick={() => handlePreviewClick(lesson)}
                          className="py-1.5 px-2.5 rounded-0 d-inline-flex align-items-center justify-content-center border-0"
                          title="Xem trước bài giảng"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        {/* EARS[State-driven]: TRONG KHI khóa học đang pending, vô hiệu hóa nút Edit/Delete */}
                        {locked ? (
                          <>
                            <Button 
                              variant="outline-secondary"
                              disabled
                              className="py-1.5 px-2.5 rounded-0 d-inline-flex align-items-center justify-content-center border-0 shadow-none text-muted"
                              title="Khóa học đang chờ duyệt, không thể sửa bài học"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </Button>
                            <Button 
                              variant="outline-danger"
                              disabled
                              className="py-1.5 px-2.5 rounded-0 d-inline-flex align-items-center justify-content-center border-0 shadow-none text-muted"
                              title="Khóa học đang chờ duyệt, không thể xóa bài học"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              as={Link}
                              to={`/teacher/lessons/${lesson.id}/edit`}
                              variant="outline-secondary"
                              className="py-1.5 px-2.5 rounded-0 d-inline-flex align-items-center justify-content-center border-0"
                              title="Sửa thông tin"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </Button>
                            <Button 
                              variant="outline-danger"
                              onClick={() => handleDeleteClick(lesson)}
                              className="py-1.5 px-2.5 rounded-0 d-inline-flex align-items-center justify-content-center border-0"
                              title="Xóa bài học"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Xác nhận xóa bài học</Modal.Title></Modal.Header>
        <Modal.Body className="py-3">Bạn có chắc chắn muốn xóa bài học <strong className="text-danger">"{lessonToDelete?.title}"</strong>? Hành động này không thể hoàn tác.</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="fw-semibold rounded-pill px-4">Hủy</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting} className="fw-semibold rounded-pill px-4">{deleting ? 'Đang xóa...' : 'Xác nhận xóa'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Lesson Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark">
            <span className="text-primary small d-block mb-1">Xem trước bài giảng</span>
            {lessonToPreview?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="mb-3 d-flex flex-wrap gap-3 text-secondary small bg-light p-2.5 rounded-0">
            <div>
              <strong>Khóa học:</strong> {lessonToPreview && getCourseTitle(lessonToPreview.courseId)}
            </div>
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
                <div className="ratio ratio-16x9 rounded overflow-hidden shadow-none border border-dark">
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
              <div className="p-3 bg-light border rounded d-flex flex-column gap-2 shadow-none border border-dark">
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
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)} className="fw-semibold rounded-pill px-4">Đóng</Button>
        </Modal.Footer>
      </Modal>
      </Container></div></div>
  );
}
