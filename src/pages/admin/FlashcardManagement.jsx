import React, { useState, useEffect, useCallback } from 'react';
import { Table, Badge, Spinner, Alert, Container, Form, Row, Col, Button, Dropdown, Card } from 'react-bootstrap';
import ConfirmModal from '../../components/common/ConfirmModal';
import axios from 'axios';

const API_URL = 'http://localhost:9999';

export default function AdminFlashcardManagement() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    actionData: null,
    actionType: '',
  });

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/flashcardDecks`);
      const data = res.data;
      setDecks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load flashcard decks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const openConfirmModal = (actionType, deck, newValue = null) => {
    let title = '';
    let message = '';
    let variant = 'warning';

    if (actionType === 'status') {
      title = 'Thay đổi trạng thái Flashcard';
      message = `Bạn có chắc muốn chuyển "${deck.title}" sang trạng thái "${newValue}"?`;
    } else if (actionType === 'delete') {
      title = 'Xóa Flashcard';
      message = `Bạn có chắc muốn xóa vĩnh viễn bộ Flashcard "${deck.title}"?`;
      variant = 'danger';
    }

    setConfirmModal({ isOpen: true, title, message, variant, actionData: { deckId: deck.id, newValue }, actionType });
  };

  const handleConfirmAction = async () => {
    const { actionType, actionData } = confirmModal;
    const { deckId, newValue } = actionData;

    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setLoading(true);

      if (actionType === 'status') {
        await axios.patch(`${API_URL}/flashcardDecks/${deckId}`, { status: newValue });
      } else if (actionType === 'delete') {
        await axios.delete(`${API_URL}/flashcardDecks/${deckId}`);
      }

      fetchDecks();
    } catch (err) {
      setError(`Hành động thất bại: ${err.message}`);
      setLoading(false);
    }
  };

  const filteredDecks = decks.filter(deck => 
    deck.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    deck.teacherId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-card-text"></i> Quản lý</div>
            <h1 className="tp-page-title">Flashcards</h1>
            <p className="tp-page-sub">Giám sát các bộ từ vựng trên toàn hệ thống</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          {/* Lọc & Tìm kiếm */}
          <Card className="studio-filter-card mb-4">
            <Row>
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Tìm theo tiêu đề hoặc ID giáo viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tp-input"
                />
              </Col>
            </Row>
          </Card>

          <Card className="studio-table-card">
            {error && <Alert variant="danger">{error}</Alert>}
            
            {loading ? (
              <div className="d-flex justify-content-center p-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="text-center p-5 text-muted">
                Không có bộ Flashcard nào.
              </div>
            ) : (
              <div className="table-responsive">
                <Table responsive hover className="align-middle">
                  <thead>
                    <tr>
                      <th className="ps-4">Tên bộ từ vựng</th>
                      <th>Teacher ID</th>
                      <th>Chế độ</th>
                      <th>Trạng thái</th>
                      <th className="text-end pe-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDecks.map(deck => (
                      <tr key={deck.id}>
                        <td className="ps-4 fw-semibold text-dark">{deck.title}</td>
                        <td className="text-muted">{deck.teacherId}</td>
                        <td>
                          {deck.deckMode === 'course' ? (
                            <Badge bg="info" className="rounded-pill text-dark px-3">Theo khóa học</Badge>
                          ) : (
                            <Badge bg="success" className="rounded-pill px-3">Tự do (Free)</Badge>
                          )}
                        </td>
                        <td>
                          {deck.status === 'published' ? (
                            <Badge bg="success" className="rounded-pill px-3">Published</Badge>
                          ) : deck.status === 'pending' ? (
                            <Badge bg="warning" className="text-dark rounded-pill px-3">Pending</Badge>
                          ) : (
                            <Badge bg="secondary" className="rounded-pill px-3">Draft</Badge>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="light" size="sm" className="rounded-pill border-0" id={`deck-action-${deck.id}`}>
                              Quản lý
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-sm border-0">
                              <Dropdown.Header>Thay đổi trạng thái</Dropdown.Header>
                              {deck.status !== 'published' && (
                                <Dropdown.Item className="text-success" onClick={() => openConfirmModal('status', deck, 'published')}>
                                  ✓ Publish
                                </Dropdown.Item>
                              )}
                              {deck.status !== 'draft' && (
                                <Dropdown.Item className="text-secondary" onClick={() => openConfirmModal('status', deck, 'draft')}>
                                  ✏️ Draft
                                </Dropdown.Item>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger fw-bold" onClick={() => openConfirmModal('delete', deck)}>
                                🗑 Xóa bộ Flashcard
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
}
