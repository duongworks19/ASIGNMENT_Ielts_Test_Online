/**
 * LessonManagement.jsx — Admin: Quản lý toàn bộ Lessons
 * Route: /admin/lessons
 *
 * Traceability Matrix:
 * - ADM-CONTENT: Admin quản lý toàn bộ lessons
 * - PLAN §2.2: Component dùng Bootstrap 5, PascalCase
 * - SPEC §6: Lessons collection với status: draft/published
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Button, Badge, Spinner, Alert, Dropdown, Card, Container } from 'react-bootstrap';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getLessons, updateLesson, deleteLesson } from '../../services/adminService';

// EARS[Ubiquitous]: THE system SHALL display lesson management page at /admin/lessons
const LessonManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', q: '' });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    actionData: null,
    actionType: '',
  });

  // EARS[Event]: WHEN Admin loads LessonManagement, THE system SHALL fetch all lessons
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.q) params.q = filters.q;
      const data = await getLessons(params);
      setLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Không thể tải danh sách bài học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const openConfirmModal = (actionType, lesson, newValue = null) => {
    let title = '';
    let message = '';
    let variant = 'danger';

    if (actionType === 'status') {
      title = 'Thay đổi trạng thái bài học';
      message = `Bạn có chắc muốn chuyển "${lesson.title}" sang trạng thái "${newValue}"?`;
      variant = 'warning';
    } else if (actionType === 'delete') {
      title = 'Xóa bài học';
      message = `Bạn có chắc muốn xóa vĩnh viễn bài học "${lesson.title}"? Hành động này không thể hoàn tác.`;
      variant = 'danger';
    }

    setConfirmModal({ isOpen: true, title, message, variant, actionData: { lessonId: lesson.id, newValue }, actionType });
  };

  const handleConfirmAction = async () => {
    const { actionType, actionData } = confirmModal;
    const { lessonId, newValue } = actionData;

    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setLoading(true);

      if (actionType === 'status') {
        // EARS[Event]: WHEN Admin changes lesson status, THE system SHALL patch lessons.status
        await updateLesson(lessonId, { status: newValue });
      } else if (actionType === 'delete') {
        // EARS[Event]: WHEN Admin deletes a lesson, THE system SHALL remove it permanently
        await deleteLesson(lessonId);
      }

      fetchLessons();
    } catch (err) {
      setError(`Hành động thất bại: ${err.message}`);
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-play-btn-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Bài học</h1>
            <p className="tp-page-sub">Quản lý toàn bộ bài học trong hệ thống</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          <div className="d-flex justify-content-end mb-3">
            <Badge bg="success" className="fs-6 px-3 py-2 rounded-pill shadow-sm">{lessons.length} Bài học</Badge>
          </div>

          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

          {/* Filter Bar */}
          <Card className="studio-filter-card mb-4">
            <Form className="row g-3 align-items-end">
              <div className="col-md-5">
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên bài học..."
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  className="tp-input"
                  id="lesson-search-input"
                />
              </div>
              <div className="col-md-4">
                <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="tp-input" id="lesson-status-filter">
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Button variant="outline-secondary" className="w-100 rounded-pill" onClick={() => setFilters({ status: '', q: '' })}>
                  Xóa bộ lọc
                </Button>
              </div>
            </Form>
          </Card>

          {/* Table */}
          <Card className="studio-table-card">
            {loading ? (
              <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center p-5 text-muted">
                Không tìm thấy bài học nào phù hợp.
              </div>
            ) : (
              <div className="table-responsive">
                <Table responsive hover className="align-middle">
                <thead>
                <tr>
                  <th className="ps-4">Tên bài học</th>
                  <th>Course ID</th>
                  <th>Thứ tự</th>
                  <th>Thời lượng</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end pe-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                  {lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td className="ps-4">
                        <div className="fw-medium">{lesson.title}</div>
                        <small className="text-muted">{lesson.id}</small>
                      </td>
                      <td>
                        <code className="text-primary">{lesson.courseId}</code>
                      </td>
                      <td className="text-center">
                        <Badge bg="light" text="dark" className="border">{lesson.order}</Badge>
                      </td>
                      <td className="text-muted">{lesson.durationMinutes} phút</td>
                      <td>
                        <Badge bg={getStatusVariant(lesson.status)} className="rounded-pill text-capitalize">
                          {lesson.status}
                        </Badge>
                      </td>
                      <td className="text-muted">
                        {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="text-end pe-4">
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="light" size="sm" className="rounded-pill border-0" id={`lesson-action-${lesson.id}`}>
                            Quản lý
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0">
                            <Dropdown.Header>Thay đổi trạng thái</Dropdown.Header>
                            {lesson.status !== 'published' && (
                              <Dropdown.Item className="text-success" onClick={() => openConfirmModal('status', lesson, 'published')}>
                                ✓ Publish
                              </Dropdown.Item>
                            )}
                            {lesson.status !== 'draft' && (
                              <Dropdown.Item className="text-secondary" onClick={() => openConfirmModal('status', lesson, 'draft')}>
                                📝 Set Draft
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger fw-bold" onClick={() => openConfirmModal('delete', lesson)}>
                              🗑 Xóa bài học
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

export default LessonManagement;
