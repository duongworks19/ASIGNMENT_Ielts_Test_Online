import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';

export default function CourseManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // States Modal xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // State Modal cảnh báo giới hạn thao tác
  const [restrictionModal, setRestrictionModal] = useState({ show: false, title: '', message: '' });

  const currentUser = getCurrentUser();
  // EARS[Ubiquitous]: THE system SHALL restrict courses list to only the teacher's owned courses.
  const teacherId = currentUser?.id || 'u-teacher-001';

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherCourseService.getCourses(teacherId);
      setCourses(data);
    } catch (err) {
      // EARS[Unwanted]: WHERE server connections fail, THE system SHALL display an error message.
      setError('Không thể kết nối đến máy chủ để lấy danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý bộ lọc và tìm kiếm client-side
  const filteredCourses = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSkill = selectedSkill ? course.skill === selectedSkill : true;
    const matchLevel = selectedLevel ? course.level === selectedLevel : true;
    const matchStatus = selectedStatus ? course.status === selectedStatus : true;
    return matchSearch && matchSkill && matchLevel && matchStatus;
  });

  const handleEditClick = (course) => {
    if (course.status === 'pending') {
      setRestrictionModal({
        show: true,
        title: 'Thao tác bị giới hạn',
        message: `Khóa học "${course.title}" đang trong quá trình chờ phê duyệt nên tạm thời bị khóa chỉnh sửa.`
      });
      return;
    }
    navigate(`/teacher/courses/${course.id}/edit`);
  };

  const handleDeleteClick = (course) => {
    // EARS[Unwanted]: WHERE course is approved or pending, THE system SHALL prevent deletion.
    if (course.status === 'approved') {
      setRestrictionModal({
        show: true,
        title: 'Thao tác bị giới hạn',
        message: `Khóa học "${course.title}" đã được quản trị viên phê duyệt. Không thể xóa khóa học đã xuất bản.`
      });
      return;
    }
    if (course.status === 'pending') {
      setRestrictionModal({
        show: true,
        title: 'Thao tác bị giới hạn',
        message: `Khóa học "${course.title}" đang trong quá trình chờ phê duyệt. Không thể xóa khi đang kiểm duyệt.`
      });
      return;
    }
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await teacherCourseService.deleteCourse(courseToDelete.id);
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (err) {
      alert('Xóa khóa học thất bại. Vui lòng thử lại sau.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="tp-badge tp-badge-success"><i className="bi bi-check-circle-fill"></i> Approved</span>;
      case 'pending':  return <span className="tp-badge tp-badge-warning"><i className="bi bi-clock-fill"></i> Pending</span>;
      case 'rejected': return <span className="tp-badge tp-badge-danger"><i className="bi bi-x-circle-fill"></i> Rejected</span>;
      default:         return <span className="tp-badge tp-badge-secondary">Draft</span>;
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      {/* ── PAGE HEADER ── */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-journal-bookmark-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Quản lý Khóa học</h1>
            <p className="tp-page-sub">Xây dựng, chỉnh sửa và gửi kiểm duyệt các khóa học IELTS của bạn.</p>
          </div>
          <Link to="/teacher/courses/create" className="tp-btn-primary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-plus-circle-fill"></i> Tạo khóa học mới
          </Link>
        </div>
      </div>

      <div className="tp-main-content">
      <Container fluid="xxl" className="px-4">
      {error && <div className="tp-error mb-4"><i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i><div className="text-secondary">{error}</div></div>}

      {/* ── FILTER BAR ── */}
      <div className="tp-filter-bar">
        <Form className="row g-3">
          <Col lg={4} md={6}>
            <Form.Group controlId="search">
              <Form.Label className="fw-semibold text-secondary">Tìm kiếm theo tên</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhập tên khóa học..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-gray shadow-none"
              />
            </Form.Group>
          </Col>
          <Col lg={2} md={6}>
            <Form.Group controlId="skill">
              <Form.Label className="fw-semibold text-secondary">Kỹ năng</Form.Label>
              <Form.Select 
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="border-gray shadow-none"
              >
                <option value="">Tất cả kỹ năng</option>
                <option value="Listening">Listening</option>
                <option value="Reading">Reading</option>
                <option value="Writing">Writing</option>
                <option value="Speaking">Speaking</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={3} md={6}>
            <Form.Group controlId="level">
              <Form.Label className="fw-semibold text-secondary">Trình độ</Form.Label>
              <Form.Select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border-gray shadow-none"
              >
                <option value="">Tất cả trình độ</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={3} md={6}>
            <Form.Group controlId="status">
              <Form.Label className="fw-semibold text-secondary">Trạng thái duyệt</Form.Label>
              <Form.Select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border-gray shadow-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Form>
      </div>

      {/* Grid Danh sách khóa học */}
      {loading ? (
        <div className="tp-loading">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
          <p className="mt-3 fw-semibold text-secondary">Đang tải danh sách khóa học...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="tp-card-static">
          <div className="tp-empty">
            <div className="tp-empty-icon"><i className="bi bi-journal-x"></i></div>
            <div className="tp-empty-title">Không tìm thấy khóa học nào</div>
            <p className="tp-empty-sub">Hãy tạo khóa học mới hoặc thay đổi bộ lọc tìm kiếm phía trên.</p>
            <Link to="/teacher/courses/create" className="btn btn-primary rounded-pill px-4">Tạo khóa học mới</Link>
          </div>
        </div>
      ) : (
        <Row className="g-4">
          {filteredCourses.map(course => (
            <Col key={course.id} xl={4} md={6}>
              <div className="tp-resource-card">
                {/* Thumbnail */}
                <div className="position-relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="tp-resource-card-img"
                      onError={(e) => { e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'; }}
                    />
                  ) : (
                    <div className="tp-resource-card-img-placeholder">
                      <i className="bi bi-journal-bookmark-fill"></i>
                    </div>
                  )}
                  <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
                    <span className="tp-badge tp-badge-info">{course.skill}</span>
                    <span className="tp-badge tp-badge-secondary">{course.level}</span>
                  </div>
                </div>

                <div className="tp-resource-card-body">
                  <div>{getStatusBadge(course.status)}</div>
                  <h5 className="tp-resource-card-title">{course.title}</h5>
                  <p className="text-secondary small mb-0 text-truncate-2">{course.description}</p>
                  <div className="d-flex gap-3 text-secondary" style={{ fontSize: '0.8rem' }}>
                    <span><i className="bi bi-clock me-1 text-primary"></i>{course.durationWeeks || 0} tuần</span>
                    <span><i className="bi bi-people me-1 text-primary"></i>{course.enrolledCount || 0} HV</span>
                    <span><i className="bi bi-cash-stack me-1 text-primary"></i>{course.price === 0 ? <strong className="text-success">Miễn phí</strong> : `${course.price?.toLocaleString('vi-VN')}đ`}</span>
                  </div>
                </div>

                <div className="tp-resource-card-footer">
                  <Link to={`/teacher/courses/${course.id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold flex-grow-1 text-center">Giáo trình</Link>
                  <button className="tp-action-btn tp-action-btn-edit" title={course.status === 'pending' ? 'Đang chờ duyệt' : 'Sửa'} onClick={() => handleEditClick(course)}><i className="bi bi-pencil-square"></i></button>
                  <button className="tp-action-btn tp-action-btn-delete" title="Xóa" onClick={() => handleDeleteClick(course)}><i className="bi bi-trash"></i></button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* ── MODALS ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Xác nhận xóa khóa học</Modal.Title></Modal.Header>
        <Modal.Body className="py-3">Bạn có chắc chắn muốn xóa khóa học <strong className="text-danger">"{courseToDelete?.title}"</strong>? Hành động này không thể phục hồi.</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="fw-semibold rounded-pill px-4">Hủy</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting} className="fw-semibold rounded-pill px-4">{deleting ? 'Đang xóa...' : 'Xác nhận xóa'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={restrictionModal.show} onHide={() => setRestrictionModal({ ...restrictionModal, show: false })} centered>
        <Modal.Header closeButton className="border-0 bg-warning bg-opacity-10"><Modal.Title className="fw-bold text-warning d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill"></i>{restrictionModal.title}</Modal.Title></Modal.Header>
        <Modal.Body className="py-4 text-center">
          <div className="fw-semibold fs-5 mb-2">{restrictionModal.message}</div>
          <p className="text-secondary small mb-0">Các khóa học đang chờ duyệt hoặc đã xuất bản sẽ tạm thời bị khóa chỉnh sửa và xóa.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="warning" onClick={() => setRestrictionModal({ ...restrictionModal, show: false })} className="fw-semibold rounded-pill px-4 text-dark">Đã hiểu</Button>
        </Modal.Footer>
      </Modal>

      </Container></div></div>
  );
}
