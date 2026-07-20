import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Modal, Spinner, Alert, Table, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { teacherFlashcardService } from '../../services/teacherFlashcardService';

const cardSchema = z.object({
  word: z.string().min(1, 'Từ vựng không được để trống').max(100, 'Tối đa 100 ký tự'),
  meaning: z.string().min(1, 'Nghĩa không được để trống').max(300, 'Tối đa 300 ký tự'),
  pronunciation: z.string().optional(),
  example: z.string().optional(),
});

export default function FlashcardDeckDetail() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(cardSchema)
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deckData, cardsData] = await Promise.all([
        teacherFlashcardService.getDeckById(deckId),
        teacherFlashcardService.getCardsByDeck(deckId)
      ]);
      setDeck(deckData);
      setCards(cardsData);
    } catch (err) {
      setError('Không thể tải dữ liệu bộ từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  // --- Checklist Logic ---
  const checkList = deck ? {
    hasTitle: !!deck.title?.trim(),
    hasDescription: !!deck.description?.trim(),
    has10Cards: cards.length >= 10,
    allHaveWord: cards.length > 0 && cards.every(c => c.word?.trim()),
    allHaveMeaning: cards.length > 0 && cards.every(c => c.meaning?.trim()),
    validMode: ['free', 'course', 'premium'].includes(deck.deckMode),
    validCourse: deck.deckMode !== 'course' || !!deck.courseId
  } : {};

  const canPublish = Object.values(checkList).every(Boolean);

  const handleTogglePublish = async () => {
    if (!deck) return;
    
    if (deck.status === 'published') {
      // Toggle to draft
      setPublishing(true);
      try {
        const updated = await teacherFlashcardService.updateDeck(deck.id, { status: 'draft', updatedAt: new Date().toISOString() });
        setDeck({ ...deck, ...updated });
        toast.success('Đã chuyển bộ từ vựng về Draft.');
      } catch (err) {
        toast.error('Không thể cập nhật trạng thái.');
      } finally {
        setPublishing(false);
      }
      return;
    }

    // Toggle to publish
    if (!canPublish) {
      toast.error('Vui lòng hoàn thành tất cả yêu cầu trong Checklist trước khi Publish.');
      return;
    }

    setPublishing(true);
    try {
      const updated = await teacherFlashcardService.updateDeck(deck.id, { status: 'published', updatedAt: new Date().toISOString() });
      setDeck({ ...deck, ...updated });
      toast.success('Đã Publish bộ từ vựng thành công!');
    } catch (err) {
      toast.error('Không thể publish bộ từ vựng.');
    } finally {
      setPublishing(false);
    }
  };

  // --- Form Handlers ---
  const handleOpenCreateModal = () => {
    setEditingCard(null);
    reset({ word: '', meaning: '', pronunciation: '', example: '' });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (card) => {
    setEditingCard(card);
    reset({ 
      word: card.word, 
      meaning: card.meaning, 
      pronunciation: card.pronunciation || '', 
      example: card.example || '' 
    });
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingCard(null);
    reset();
  };

  const onSubmitForm = async (data) => {
    setSubmitting(true);
    try {
      if (editingCard) {
        const updatedCard = await teacherFlashcardService.updateCard(editingCard.id, data);
        setCards(cards.map(c => c.id === editingCard.id ? updatedCard : c));
        toast.success('Đã cập nhật từ vựng.');
      } else {
        const newCardData = {
          ...data,
          deckId,
          status: 'active',
          imageUrl: '',
          audioUrl: ''
        };
        const newCard = await teacherFlashcardService.createCard(newCardData);
        setCards([...cards, newCard]);
        toast.success('Đã thêm từ vựng mới.');
      }
      handleCloseFormModal();
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi lưu từ vựng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (card) => {
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    setDeleting(true);
    try {
      await teacherFlashcardService.deleteCard(cardToDelete.id);
      setCards(cards.filter(c => c.id !== cardToDelete.id));
      toast.success('Đã xóa từ vựng.');
      setShowDeleteModal(false);
      setCardToDelete(null);
    } catch (err) {
      toast.error('Xóa từ vựng thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-secondary fw-semibold">Đang tải chi tiết bộ từ vựng...</p>
      </Container>
    );
  }

  if (error || !deck) {
    return (
      <Container fluid className="py-5 text-center">
        <Alert variant="danger">{error || 'Không tìm thấy bộ từ vựng.'}</Alert>
        <Button variant="outline-primary" onClick={() => navigate('/teacher/flashcards')}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 test-management-page">
      <style>
        {`
          .test-management-page { animation: testPageEnter 220ms ease both; }
          .hover-primary:hover { color: #0d6efd !important; background-color: #f8f9fa; }
          .hover-danger:hover { color: #dc3545 !important; background-color: #f8f9fa; }
          @keyframes testPageEnter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant="light" 
            onClick={() => navigate('/teacher/flashcards')}
            className="rounded-circle d-flex align-items-center justify-content-center border"
            style={{ width: '40px', height: '40px' }}
          >
            <i className="bi bi-arrow-left"></i>
          </Button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="fw-bold text-dark mb-0">{deck.title}</h2>
              <Badge bg={deck.status === 'published' ? 'success' : 'secondary'}>
                {deck.status || 'draft'}
              </Badge>
            </div>
            <p className="text-secondary mb-0 mt-1">{deck.description || 'Không có mô tả'}</p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button 
            as={Link}
            to={`/learning/flashcards/${deck.id}?preview=true`}
            target="_blank"
            variant="outline-primary" 
            className="d-flex align-items-center gap-2 rounded-pill fw-semibold"
          >
            <i className="bi bi-eye"></i> Preview as Student
          </Button>
          <Button 
            variant={deck.status === 'published' ? 'outline-warning' : 'success'} 
            onClick={handleTogglePublish}
            disabled={publishing || (deck.status !== 'published' && !canPublish)}
            className="d-flex align-items-center gap-2 rounded-pill fw-semibold px-4"
          >
            <i className={`bi bi-${deck.status === 'published' ? 'arrow-counterclockwise' : 'cloud-arrow-up'}`}></i> 
            {publishing ? 'Đang xử lý...' : deck.status === 'published' ? 'Chuyển về Draft' : 'Publish Deck'}
          </Button>
        </div>
      </div>

      <Row>
        <Col xl={3} lg={4}>
          {/* Checklist Sidebar */}
          <Card className="border-0 shadow-sm rounded-3 bg-white mb-4 position-sticky" style={{ top: '20px' }}>
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-list-check text-primary"></i> Publish Checklist
              </h6>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.hasTitle ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.hasTitle ? '✅' : '⚪'} 
                <span>Tiêu đề không bị trống</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.hasDescription ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.hasDescription ? '✅' : '⚪'} 
                <span>Mô tả không bị trống</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.has10Cards ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.has10Cards ? '✅' : '⚪'} 
                <span>Có ít nhất 10 thẻ từ ({cards.length}/10)</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.allHaveWord ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.allHaveWord ? '✅' : '⚪'} 
                <span>Tất cả thẻ đều có Từ vựng (Word)</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.allHaveMeaning ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.allHaveMeaning ? '✅' : '⚪'} 
                <span>Tất cả thẻ đều có Nghĩa (Meaning)</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 border-bottom ${checkList.validMode ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.validMode ? '✅' : '⚪'} 
                <span>Deck Mode hợp lệ</span>
              </ListGroup.Item>
              <ListGroup.Item className={`d-flex align-items-center gap-2 py-3 ${checkList.validCourse ? 'bg-success bg-opacity-10 text-success fw-bold' : 'text-muted'}`}>
                {checkList.validCourse ? '✅' : '⚪'} 
                <span>Đã gán Khóa học (Nếu Mode = Course)</span>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col xl={9} lg={8}>
          <Card className="border-0 shadow-sm rounded-3 bg-white">
            <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Danh sách từ vựng ({cards.length})</h5>
              <Button 
                onClick={handleOpenCreateModal}
                variant="primary" 
                className="d-flex align-items-center gap-2 px-3 py-2 shadow-sm rounded-pill fw-semibold"
              >
                <i className="bi bi-plus-lg"></i> Thêm từ vựng
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {cards.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-card-checklist text-muted fs-1 mb-3"></i>
                  <h5 className="fw-semibold text-secondary">Bộ từ vựng này chưa có thẻ nào</h5>
                  <p className="text-muted small">Hãy nhấn "Thêm từ vựng" để tạo thẻ đầu tiên.</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '20%' }}>Từ vựng (Word)</th>
                      <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '15%' }}>Phiên âm</th>
                      <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '25%' }}>Nghĩa (Meaning)</th>
                      <th className="py-3 fw-semibold text-secondary border-bottom-0" style={{ width: '25%' }}>Ví dụ (Example)</th>
                      <th className="px-4 py-3 fw-semibold text-secondary border-bottom-0 text-end" style={{ whiteSpace: 'nowrap' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map(card => (
                      <tr key={card.id}>
                        <td className="px-4 py-3">
                          <strong className="text-primary">{card.word}</strong>
                        </td>
                        <td className="py-3 text-secondary">{card.pronunciation || '-'}</td>
                        <td className="py-3">{card.meaning}</td>
                        <td className="py-3 text-secondary fst-italic small">
                          {card.example ? `"${card.example}"` : '-'}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="d-flex gap-2 justify-content-end flex-nowrap">
                            <Button 
                              variant="light" 
                              size="sm"
                              onClick={() => handleOpenEditModal(card)}
                              className="text-secondary hover-primary"
                            >
                              <i className="bi bi-pencil me-1"></i> Sửa
                            </Button>
                            <Button 
                              variant="light" 
                              size="sm"
                              onClick={() => handleDeleteClick(card)}
                              className="text-danger hover-danger"
                            >
                              <i className="bi bi-trash me-1"></i> Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Tạo/Sửa Card */}
      <Modal show={showFormModal} onHide={handleCloseFormModal} centered size="lg">
        <Form onSubmit={handleSubmit(onSubmitForm)}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold text-dark">
              {editingCard ? 'Chỉnh sửa Từ vựng' : 'Thêm Từ vựng mới'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-3">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="cardWord">
                  <Form.Label className="fw-semibold">Từ vựng (Word) <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: Adequate"
                    {...register('word')}
                    isInvalid={!!errors.word}
                    className="shadow-none border-gray py-2"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.word?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="cardPronunciation">
                  <Form.Label className="fw-semibold">Phiên âm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="VD: /ˈæd.ə.kwət/"
                    {...register('pronunciation')}
                    isInvalid={!!errors.pronunciation}
                    className="shadow-none border-gray py-2"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.pronunciation?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="cardMeaning">
              <Form.Label className="fw-semibold">Nghĩa tiếng Việt (Meaning) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="VD: Đầy đủ, thích đáng"
                {...register('meaning')}
                isInvalid={!!errors.meaning}
                className="shadow-none border-gray py-2"
              />
              <Form.Control.Feedback type="invalid">
                {errors.meaning?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="cardExample">
              <Form.Label className="fw-semibold">Ví dụ minh họa (Example)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="VD: He didn't have adequate time to prepare for the exam."
                {...register('example')}
                isInvalid={!!errors.example}
                className="shadow-none border-gray py-2"
              />
              <Form.Control.Feedback type="invalid">
                {errors.example?.message}
              </Form.Control.Feedback>
            </Form.Group>

          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleCloseFormModal} className="fw-semibold px-4 rounded-pill">
              Hủy
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
              className="fw-semibold px-4 rounded-pill shadow-sm"
            >
              {submitting ? 'Đang lưu...' : 'Lưu lại'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark">Xác nhận xóa từ vựng</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          Bạn có chắc chắn muốn xóa từ vựng <strong className="text-danger">"{cardToDelete?.word}"</strong> không? 
          Hành động này không thể phục hồi.
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="fw-semibold px-3 rounded-pill">
            Hủy bỏ
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmDelete} 
            disabled={deleting}
            className="fw-semibold px-4 rounded-pill shadow-sm"
          >
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}
