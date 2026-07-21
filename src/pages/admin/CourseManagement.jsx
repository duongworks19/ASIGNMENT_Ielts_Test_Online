/**
 * CourseManagement.jsx — Admin: Quản lý toàn bộ Courses
 * Route: /admin/courses
 *
 * Traceability Matrix:
 * - ADM-CONTENT: Admin quản lý toàn bộ courses
 * - PLAN §2.2: Component dùng Bootstrap 5, PascalCase
 * - SPEC §6: Courses collection với status: pending/approved/rejected
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Button, Badge, Spinner, Alert, Dropdown, Card, Container, Modal } from 'react-bootstrap';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getCourses, updateCourse, deleteCourse } from '../../services/adminService';

// EARS[Ubiquitous]: THE system SHALL display course management page at /admin/courses
const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ skill: '', status: '', q: '' });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    actionData: null,
    actionType: '',
  });

  const [priceModal, setPriceModal] = useState({
    isOpen: false,
    courseId: null,
    currentPrice: 0,
    newPrice: 0
  });

  const openPriceModal = (course) => {
    setPriceModal({
      isOpen: true,
      courseId: course.id,
      currentPrice: course.price || 0,
      newPrice: course.price || 0
    });
  };

  const handleSavePrice = async () => {
    try {
      setPriceModal(prev => ({ ...prev, isOpen: false }));
      setLoading(true);
      await updateCourse(priceModal.courseId, { price: Number(priceModal.newPrice) });
      fetchCourses();
    } catch (err) {
      setError(`Lỗi khi sửa giá: ${err.message}`);
      setLoading(false);
    }
  };

  // EARS[Event]: WHEN Admin loads CourseManagement, THE system SHALL fetch all courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.skill) params.skill = filters.skill;
      if (filters.status) params.status = filters.status;
      if (filters.q) params.q = filters.q;
      const data = await getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const openConfirmModal = (actionType, course, newValue = null) => {
    let title = '';
    let message = '';
    let variant = 'danger';

    if (actionType === 'status') {
      title = 'Thay đổi trạng thái khóa học';
      message = `Bạn có chắc muốn chuyển "${course.title}" sang trạng thái "${newValue}"?`;
      variant = newValue === 'approved' ? 'warning' : 'danger';
    } else if (actionType === 'delete') {
      title = 'Xóa khóa học';
      message = `Bạn có chắc muốn xóa vĩnh viễn khóa học "${course.title}"? Hành động này không thể hoàn tác.`;
      variant = 'danger';
    }

    setConfirmModal({ isOpen: true, title, message, variant, actionData: { courseId: course.id, newValue }, actionType });
  };

  const handleConfirmAction = async () => {
    const { actionType, actionData } = confirmModal;
    const { courseId, newValue } = actionData;

    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setLoading(true);

      if (actionType === 'status') {
        // EARS[Event]: WHEN Admin changes course status, THE system SHALL patch courses.status
        await updateCourse(courseId, { status: newValue });
      } else if (actionType === 'delete') {
        // EARS[Event]: WHEN Admin deletes a course, THE system SHALL remove it from the database
        await deleteCourse(courseId);
      }

      fetchCourses();
    } catch (err) {
      setError(`Hành động thất bại: ${err.message}`);
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="admin-page-shell">
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-journal-bookmark"></i> Quản lý</div>
            <h1 className="tp-page-title">Khóa học</h1>
            <p className="tp-page-sub">Quản lý toàn bộ khóa học trong hệ thống</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          <div className="d-flex justify-content-end mb-3">
            <Badge bg="primary" className="fs-6 px-3 py-2 rounded-pill shadow-sm">{courses.length} Khóa học</Badge>
          </div>

          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

          {/* Filter Bar */}
          <Card className="studio-filter-card mb-4">
            <Form className="row g-3 align-items-end">
              <div className="col-md-4">
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên khóa học..."
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  className="tp-input"
                  id="course-search-input"
                />
              </div>
              <div className="col-md-3">
                <Form.Select name="skill" value={filters.skill} onChange={handleFilterChange} className="tp-input" id="course-skill-filter">
                  <option value="">Tất cả kỹ năng</option>
                  <option value="Reading">Reading</option>
                  <option value="Listening">Listening</option>
                  <option value="Writing">Writing</option>
                  <option value="Speaking">Speaking</option>
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="tp-input" id="course-status-filter">
                  <option value="">Tất cả trạng thái</option>
                  <option value="approved">Approved (Đã duyệt)</option>
                  <option value="pending">Pending (Chờ duyệt)</option>
                  <option value="rejected">Rejected (Từ chối)</option>
                  <option value="draft">Draft (Bản nháp)</option>
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Button variant="outline-secondary" className="w-100 rounded-pill" onClick={() => setFilters({ skill: '', status: '', q: '' })}>
                  Xóa bộ lọc
                </Button>
              </div>
            </Form>
          </Card>

          {/* Course List Table */}
          <Card className="studio-table-card">
            {loading ? (
              <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center p-5 text-muted">
                Không tìm thấy khóa học nào phù hợp.
              </div>
            ) : (
              <div className="table-responsive">
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th className="ps-4">Tên khóa học</th>
                      <th>Kỹ năng</th>
                      <th>Cấp độ</th>
                      <th>Học viên</th>
                      <th>Giá</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th className="text-end pe-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td className="ps-4">
                          <div className="fw-medium">{course.title}</div>
                          <small className="text-muted">{course.id}</small>
                        </td>
                        <td>
                          <Badge bg="info" text="dark" className="rounded-pill">{course.skill}</Badge>
                        </td>
                        <td className="text-muted">{course.level}</td>
                        <td>{course.enrolledCount ?? 0}</td>
                        <td>{formatPrice(course.price)}</td>
                        <td>
                          <Badge bg={getStatusVariant(course.status)} className="rounded-pill text-capitalize">
                            {course.status}
                          </Badge>
                        </td>
                        <td className="text-muted">
                          {course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className="text-end pe-4">
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="light" size="sm" className="rounded-pill border-0" id={`course-action-${course.id}`}>
                              Quản lý
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-sm border-0">
                              <Dropdown.Header>Thay đổi trạng thái</Dropdown.Header>
                              {course.status !== 'approved' && (
                                <Dropdown.Item className="text-success" onClick={() => openConfirmModal('status', course, 'approved')}>
                                  ✓ Approve
                                </Dropdown.Item>
                              )}
                              {course.status !== 'rejected' && (
                                <Dropdown.Item className="text-danger" onClick={() => openConfirmModal('status', course, 'rejected')}>
                                  ✗ Reject
                                </Dropdown.Item>
                              )}
                              {course.status !== 'pending' && (
                                <Dropdown.Item className="text-warning" onClick={() => openConfirmModal('status', course, 'pending')}>
                                  ⏳ Set Pending
                                </Dropdown.Item>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger fw-bold" onClick={() => openConfirmModal('delete', course)}>
                                🗑 Xóa khóa học
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </Container>
      </div>

      <Modal show={priceModal.isOpen} onHide={() => setPriceModal(prev => ({ ...prev, isOpen: false }))} centered>
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-bold">Sửa giá khóa học</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Giá mới (VNĐ)</Form.Label>
            <Form.Control
              type="number"
              value={priceModal.newPrice}
              onChange={(e) => setPriceModal(prev => ({ ...prev, newPrice: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="light" onClick={() => setPriceModal(prev => ({ ...prev, isOpen: false }))} className="rounded-pill px-4">
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSavePrice} className="rounded-pill px-4">
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default CourseManagement;
