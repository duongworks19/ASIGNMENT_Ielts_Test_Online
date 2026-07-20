import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Form, Modal, Spinner, Table } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherFlashcardService } from '../../services/teacherFlashcardService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const deckSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(100, 'Tiêu đề tối đa 100 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  deckMode: z.string().default('free'),
  courseId: z.string().optional().default(''),
});

export default function FlashcardManagementPage() {
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';

  const [decks, setDecks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [cardsCount, setCardsCount] = useState({}); // deckId -> count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deckToAssign, setDeckToAssign] = useState(null);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignDeckMode, setAssignDeckMode] = useState('free');
  
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get('courseId') || '';
  const [working, setWorking] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      title: '',
      description: '',
      deckMode: 'free',
      courseId: ''
    }
  });

  const formDeckMode = watch('deckMode') || 'free';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, decksData] = await Promise.all([
        teacherCourseService.getCourses(teacherId),
        teacherFlashcardService.getDecksByTeacher(teacherId),
      ]);
      setCourses(coursesData);
      setDecks(decksData);

      // Fetch card counts for all decks
      const counts = {};
      await Promise.all(
        decksData.map(async (deck) => {
          const cards = await teacherFlashcardService.getCardsByDeck(deck.id);
          counts[deck.id] = cards.length;
        })
      );
      setCardsCount(counts);
    } catch (err) {
      setError('Không thể kết nối đến máy chủ để tải danh sách bộ từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  const getCourseTitle = useCallback((courseId) => {
    if (!courseId) return 'Chưa gán khóa học';
    const course = courses.find((item) => String(item.id) === String(courseId));
    return course ? course.title : 'Khóa học không xác định';
  }, [courses]);

  useEffect(() => {
    if (queryCourseId && courses.length > 0) {
      if (!editingDeck && !showFormModal) {
        setEditingDeck(null);
        reset({ 
          title: '', 
          description: '', 
          deckMode: 'course', 
          courseId: queryCourseId 
        });
        setShowFormModal(true);
      }
    }
  }, [queryCourseId, courses, reset, editingDeck, showFormModal]);

  const filteredDecks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      const matchSearch = !keyword || deck.title?.toLowerCase().includes(keyword);
      const matchCourse = selectedCourseId ? String(deck.courseId) === String(selectedCourseId) : true;
      const matchMode = selectedMode ? deck.deckMode === selectedMode : true;
      const matchStatus = selectedStatus ? deck.status === selectedStatus : true;
      return matchSearch && matchCourse && matchMode && matchStatus;
    }).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [decks, searchQuery, selectedCourseId, selectedMode, selectedStatus]);

  // --- Form Handlers ---
  const handleOpenCreateModal = () => {
    setEditingDeck(null);
    reset({ title: '', description: '', deckMode: 'free', courseId: '' });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (deck) => {
    setEditingDeck(deck);
    reset({ 
      title: deck.title, 
      description: deck.description || '',
      deckMode: deck.deckMode || 'free',
      courseId: deck.courseId || ''
    });
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingDeck(null);
    reset();
  };

  const onSubmitForm = async (data) => {
    const { title, description, deckMode, courseId } = data;
    if ((deckMode === 'course' || deckMode === 'premium') && !courseId) {
      toast.error('Vui lòng chọn khóa học liên kết.');
      return;
    }
    setWorking(true);
    try {
      if (editingDeck) {
        const payload = {
          ...data,
          courseId: deckMode === 'free' ? '' : courseId
        };
        const updatedDeck = await teacherFlashcardService.updateDeck(editingDeck.id, payload);
        setDecks(decks.map(d => d.id === editingDeck.id ? { ...d, ...updatedDeck } : d));
        toast.success('Đã cập nhật bộ từ vựng.');
      } else {
        const payload = {
          ...data,
          courseId: deckMode === 'free' ? '' : courseId,
          teacherId,
          status: 'draft',
          createdAt: new Date().toISOString()
        };
        const newDeck = await teacherFlashcardService.createDeck(payload);
        setDecks([...decks, newDeck]);
        setCardsCount({ ...cardsCount, [newDeck.id]: 0 });
        toast.success('Đã tạo bộ từ vựng mới.');
      }
      handleCloseFormModal();
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi lưu bộ từ vựng.');
    } finally {
      setWorking(false);
    }
  };

  // --- Assign Modal Handlers ---
  const openAssignModal = (deck) => {
    setDeckToAssign(deck);
    setAssignCourseId(deck.courseId || '');
    setAssignDeckMode(deck.deckMode || 'free');
    setShowAssignModal(true);
  };

  const handleAssignCourse = async () => {
    if (!deckToAssign) return;
    setWorking(true);
    try {
      // Validate premium mode doesnt have courseId, course mode must have courseId
      let finalCourseId = assignCourseId;
      if (assignDeckMode !== 'course') {
        finalCourseId = '';
      }
      if (assignDeckMode === 'course' && !finalCourseId) {
        toast.error('Vui lòng chọn khóa học.');
        setWorking(false);
        return;
      }

      const payload = {
        deckMode: assignDeckMode,
        courseId: finalCourseId,
        updatedAt: new Date().toISOString()
      };
      const updated = await teacherFlashcardService.updateDeck(deckToAssign.id, payload);
      setDecks((prev) => prev.map((item) => item.id === deckToAssign.id ? { ...item, ...updated } : item));
      toast.success('Đã cập nhật Mode và Khóa học.');
      setShowAssignModal(false);
      setDeckToAssign(null);
    } catch (err) {
      toast.error('Cập nhật thất bại.');
    } finally {
      setWorking(false);
    }
  };

  // --- Status Toggle Handlers ---
  const handleTogglePublish = async (deck) => {
    if (deck.status === 'published') {
      // To draft
      setWorking(true);
      try {
        const updated = await teacherFlashcardService.updateDeck(deck.id, { status: 'draft', updatedAt: new Date().toISOString() });
        setDecks((prev) => prev.map((item) => item.id === deck.id ? { ...item, ...updated } : item));
        toast.success('Đã chuyển bộ từ vựng về Draft.');
      } catch (err) {
        toast.error('Không thể cập nhật trạng thái.');
      } finally {
        setWorking(false);
      }
      return;
    }

    // Check constraints before publish
    const count = cardsCount[deck.id] || 0;
    if (count < 10) {
      toast.error(`Không thể Publish. Bộ từ vựng cần tối thiểu 10 thẻ từ (Hiện có: ${count}).`);
      return;
    }
    if (deck.deckMode === 'course' && !deck.courseId) {
      toast.error('Không thể Publish. Mode Course yêu cầu phải chọn khóa học liên kết.');
      return;
    }

    setWorking(true);
    try {
      const updated = await teacherFlashcardService.updateDeck(deck.id, { status: 'published', updatedAt: new Date().toISOString() });
      setDecks((prev) => prev.map((item) => item.id === deck.id ? { ...item, ...updated } : item));
      toast.success('Đã Publish bộ từ vựng thành công!');
    } catch (err) {
      toast.error('Không thể publish bộ từ vựng.');
    } finally {
      setWorking(false);
    }
  };

  // --- Delete Handlers ---
  const handleDeleteClick = (deck) => {
    setDeckToDelete(deck);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deckToDelete) return;
    setWorking(true);
    try {
      // First delete all related cards
      const cards = await teacherFlashcardService.getCardsByDeck(deckToDelete.id);
      await Promise.all(cards.map(card => teacherFlashcardService.deleteCard(card.id)));
      
      // Delete deck
      await teacherFlashcardService.deleteDeck(deckToDelete.id);
      setDecks((prev) => prev.filter((item) => item.id !== deckToDelete.id));
      toast.success('Đã xóa bộ từ vựng.');
      setShowDeleteModal(false);
      setDeckToDelete(null);
    } catch (err) {
      toast.error('Xóa bộ từ vựng thất bại.');
    } finally {
      setWorking(false);
    }
  };

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'premium': return <Badge bg="warning" text="dark"><i className="bi bi-star-fill text-danger me-1"></i>Premium</Badge>;
      case 'course': return <Badge bg="primary">Course</Badge>;
      default: return <Badge bg="success">Free</Badge>;
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-card-text"></i> Học liệu</div>
            <h1 className="tp-page-title">IELTS Flashcard Builder</h1>
            <p className="tp-page-sub">Tạo bộ từ vựng, quản lý Free/Course/Premium Mode và Publish.</p>
          </div>
          <button onClick={handleOpenCreateModal} className="tp-btn-primary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-plus-circle-fill"></i> Thêm bộ từ vựng mới
          </button>
        </div>
      </div>
      <div className="tp-main-content">
      <div className="container-fluid py-2">

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="tp-filter-bar">
        <Form className="row g-3">
          <Col md={4}>
            <Form.Label>Tìm bộ từ vựng</Form.Label>
            <Form.Control value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nhập tiêu đề..." className="shadow-none" />
          </Col>
          <Col md={3}>
            <Form.Label>Khóa học</Form.Label>
            <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="shadow-none">
              <option value="">Tất cả khóa học</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label>Mode</Form.Label>
            <Form.Select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)} className="shadow-none">
              <option value="">Tất cả</option>
              <option value="free">Free</option>
              <option value="course">Course</option>
              <option value="premium">Premium</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="shadow-none">
              <option value="">Tất cả</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Form.Select>
          </Col>
        </Form>
      </div>

      {loading ? (
        <div className="tp-loading">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
          <p className="mt-2 fw-semibold text-secondary">Đang tải danh sách bộ từ vựng...</p>
        </div>
      ) : (
        <div className="tp-table-wrapper">
          <table className="tp-table">
            <thead>
              <tr>
                <th>Bộ từ vựng</th>
                <th>Mode</th>
                <th>Khóa học</th>
                <th>Status</th>
                <th>Số lượng thẻ</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecks.map((deck) => {
                return (
                  <tr key={deck.id} className="test-management-row">
                    <td className="px-4">
                      <div className="fw-bold text-dark">{deck.title}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                        {deck.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td>{getModeBadge(deck.deckMode)}</td>
                    <td className="small">{deck.deckMode === 'course' ? getCourseTitle(deck.courseId) : '-'}</td>
                    <td>
                      <Badge bg={deck.status === 'published' ? 'success' : 'secondary'}>
                        {deck.status || 'draft'}
                      </Badge>
                    </td>
                    <td>
                      <span className={`fw-semibold ${cardsCount[deck.id] >= 10 ? 'text-success' : 'text-danger'}`}>
                        {cardsCount[deck.id] || 0}
                      </span> thẻ
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <Button as={Link} to={`/teacher/flashcards/${deck.id}`} size="sm" variant="outline-primary" title="Quản lý Thẻ">
                          <i className="bi bi-card-list"></i>
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => handleOpenEditModal(deck)} disabled={working} title="Sửa">
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button size="sm" variant="outline-info" onClick={() => openAssignModal(deck)} disabled={working} title="Cấu hình">
                          <i className="bi bi-gear"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant={deck.status === 'published' ? 'outline-warning' : 'outline-success'} 
                          onClick={() => handleTogglePublish(deck)} 
                          disabled={working}
                          title={deck.status === 'published' ? 'Về Draft' : 'Publish'}
                        >
                          <i className={`bi ${deck.status === 'published' ? 'bi-send-slash' : 'bi-send'}`}></i>
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteClick(deck)} disabled={working} title="Xóa">
                          <i className="bi bi-trash3"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDecks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">Không tìm thấy bộ từ vựng phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cấu hình (Mode & Course) */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Cấu hình Bộ từ vựng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Deck Mode</Form.Label>
            <Form.Select value={assignDeckMode} onChange={(e) => setAssignDeckMode(e.target.value)}>
              <option value="free">Free - Hiển thị công khai, học không giới hạn</option>
              <option value="course">Course - Chỉ dành cho học viên của khóa học</option>
              <option value="premium">Premium - Chỉ dành cho tài khoản Premium</option>
            </Form.Select>
          </Form.Group>
          {assignDeckMode === 'course' && (
            <Form.Group>
              <Form.Label>Khóa học liên kết <span className="text-danger">*</span></Form.Label>
              <Form.Select value={assignCourseId} onChange={(e) => setAssignCourseId(e.target.value)}>
                <option value="">-- Chọn khóa học --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowAssignModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleAssignCourse} disabled={working}>
            {working ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Tạo/Sửa Deck Info */}
      <Modal show={showFormModal} onHide={handleCloseFormModal} centered>
        <Form onSubmit={handleSubmit(onSubmitForm)}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold text-dark">
              {editingDeck ? 'Chỉnh sửa Thông tin' : 'Tạo Bộ từ vựng mới'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Form.Group className="mb-3" controlId="deckTitle">
              <Form.Label className="fw-semibold">Tiêu đề <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tiêu đề bộ từ vựng..."
                {...register('title')}
                isInvalid={!!errors.title}
                className="shadow-none border-gray py-2"
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="deckDescription">
              <Form.Label className="fw-semibold">Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Nhập mô tả ngắn gọn (không bắt buộc)..."
                {...register('description')}
                isInvalid={!!errors.description}
                className="shadow-none border-gray py-2"
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="deckMode">
              <Form.Label className="fw-semibold">Chế độ học phần</Form.Label>
              <Form.Select
                {...register('deckMode')}
                disabled={!!queryCourseId}
                className="shadow-none border-gray py-2"
              >
                <option value="free">Free - Công khai, không giới hạn</option>
                <option value="course">Course - Chỉ dành cho học viên của khóa học</option>
                <option value="premium">Premium - Chỉ dành cho tài khoản Premium</option>
              </Form.Select>
            </Form.Group>

            {(formDeckMode === 'course' || formDeckMode === 'premium') && (
              <Form.Group className="mb-3" controlId="deckCourseId">
                <Form.Label className="fw-semibold">Khóa học liên kết <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  {...register('courseId')}
                  disabled={!!queryCourseId}
                  className="shadow-none border-gray py-2"
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleCloseFormModal} className="fw-semibold px-4 rounded-0">
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={working}
              className="fw-semibold px-4 rounded-0 shadow-none border border-dark"
            >
              {working ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Xóa <strong>{deckToDelete?.title}</strong> và toàn bộ thẻ từ liên quan? (Hành động này không thể phục hồi).
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={working}>
            {working ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  </div>
</div>
  );
}
