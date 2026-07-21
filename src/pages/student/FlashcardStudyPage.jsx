import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import FlashcardDeck from '../../components/feature/flashcards/FlashcardDeck';
import FlashcardLearn from './FlashcardLearn';
import FlashcardTest from './FlashcardTest';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import './FlashcardStudyPage.css';

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getCardLabel = (card, index) => (
  card?.word || card?.frontText || card?.term || card?.vocabulary || `Flashcard ${index + 1}`
);

const getCardMeaning = (card) => (
  card?.meaning || card?.backText || card?.definition || card?.translation || ''
);

const getDeckName = (deck) => (
  deck?.name || deck?.title || deck?.topic || 'Flashcard deck'
);

const FlashcardStudyPage = () => {
  const { deckId, id } = useParams();
  const navigate = useNavigate();
  const activeDeckId = deckId || id;
  const currentUser = getCurrentUser();
  const userId = currentUser?.id;

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  // Student Add Word States
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  
  // Quizlet Modes: 'flashcards', 'learn', 'test'
  const [activeMode, setActiveMode] = useState('flashcards');

  useEffect(() => {
    let isMounted = true;

    const loadDeck = async () => {
      setLoading(true);
      setError('');

      if (!activeDeckId) {
        setError('Bộ flashcard không tồn tại.');
        setLoading(false);
        return;
      }

      try {
        const [deckResponse, cardResponse] = await Promise.all([
          api.get(`/flashcardDecks/${activeDeckId}`),
          api.get(`/flashcards?deckId=${activeDeckId}`)
        ]);

        if (!isMounted) return;

        const deckData = deckResponse.data || null;
        setDeck(deckData);
        setCards(normalizeArray(cardResponse.data));

        if (deckData && deckData.courseId) {
          try {
            const courseRes = await api.get(`/courses/${deckData.courseId}`);
            setIsPremium(!!courseRes.data?.isPremium);
          } catch (cErr) {
            console.error('Error fetching course:', cErr);
          }
        }
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError?.response?.status === 404
          ? 'Bộ flashcard không tồn tại.'
          : 'Không thể kết nối máy chủ. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDeck();

    return () => {
      isMounted = false;
    };
  }, [activeDeckId, userId]);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) {
      toast.error('Vui lòng điền đầy đủ Thuật ngữ và Định nghĩa.');
      return;
    }
    setSavingCard(true);
    try {
      const payload = {
        deckId: activeDeckId,
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        example: newExample.trim(),
        teacherId: deck?.teacherId || null,
        createdAt: new Date().toISOString()
      };
      
      const res = await api.post('/flashcards', payload);
      setCards([...cards, res.data]);
      
      setNewWord('');
      setNewMeaning('');
      setNewExample('');
      setShowAddWordModal(false);
      
      toast.success('Thêm từ vựng thành công!');
    } catch (err) {
      toast.error('Thêm từ vựng thất bại.');
    } finally {
      setSavingCard(false);
    }
  };

  if (loading) {
    return (
      <main className="container py-4">
        <div className="d-flex align-items-center gap-2 alert alert-light border" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Đang tải bộ từ vựng...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container py-4">
        <div className="alert alert-danger" role="alert">{error}</div>
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => navigate('/learning/flashcards')}>
          Quay lại
        </button>
      </main>
    );
  }

  return (
    <div style={{ backgroundColor: '#f6f7fb', minHeight: 'calc(100vh - 60px)' }}>
      <main className="container py-4">
        {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <h1 className="h3 mb-0 fw-bold">{getDeckName(deck)}</h1>
        <div className="d-flex gap-2">
          {isPremium && (
            <button 
              type="button" 
              className="btn btn-warning rounded-pill fw-semibold shadow-sm d-flex align-items-center gap-2" 
              onClick={() => setShowAddWordModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              Thêm từ của bạn
            </button>
          )}
        </div>
      </div>

      {/* Quizlet Modes Top Bar */}
      <nav className="study-mode-nav">
        <button 
          className={`mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveMode('flashcards')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg> Thẻ ghi nhớ
        </button>
        <button 
          className={`mode-btn ${activeMode === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveMode('learn')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21.5 2 21.5 8 15.5 8"></polyline><polyline points="2.5 22 2.5 16 8.5 16"></polyline><path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg> Học
        </button>
        <button 
          className={`mode-btn ${activeMode === 'test' ? 'active' : ''}`}
          onClick={() => setActiveMode('test')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Kiểm tra
        </button>
      </nav>

      {/* Main Content Area based on Mode */}
      {cards.length === 0 ? (
        <section className="card border-0 shadow-sm text-center p-5">
          <div className="card-body">
            <h2 className="h5 mb-2">Chưa có flashcard để hiển thị.</h2>
            <p className="text-muted mb-3">Bộ từ vựng này đang trống.</p>
            {isPremium && (
              <button 
                type="button" 
                className="btn btn-warning rounded-pill fw-semibold px-4" 
                onClick={() => setShowAddWordModal(true)}
              >
                Thêm từ vựng đầu tiên
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          {activeMode === 'flashcards' && (
            <>
              {/* The Flipcard Player */}
              <FlashcardDeck cards={cards} />

              {/* Term List below the deck */}
              <div className="term-list-container">
                <div className="term-list-header">
                  <h2>Thuật ngữ trong học phần này ({cards.length})</h2>
                  <select className="form-select w-auto fw-semibold border-0 shadow-sm">
                    <option>Thứ tự gốc</option>
                    <option>Bảng chữ cái</option>
                  </select>
                </div>
                
                <div className="term-list">
                  {cards.map((card, index) => (
                    <div className="term-item" key={card.id || index}>
                      <div className="term-item-content">
                        <div className="term-word">
                          {getCardLabel(card, index)}
                        </div>
                        <div className="term-definition">
                          {getCardMeaning(card)}
                        </div>
                      </div>
                      <div className="term-actions">
                        <button className="icon-btn" onClick={() => handleSpeak(getCardLabel(card, index))} title="Nghe thuật ngữ">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeMode === 'learn' && (
            <FlashcardLearn cards={cards} deckName={getDeckName(deck)} onExit={() => setActiveMode('flashcards')} />
          )}

          {activeMode === 'test' && (
            <FlashcardTest cards={cards} deckName={getDeckName(deck)} onExit={() => setActiveMode('flashcards')} />
          )}
        </>
      )}

      {/* Student Add Custom Card Modal */}
      <Modal show={showAddWordModal} onHide={() => setShowAddWordModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Thêm từ vựng mới của bạn</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCard}>
          <Modal.Body className="py-2">
            <Form.Group className="mb-3" controlId="newWord">
              <Form.Label className="fw-semibold text-secondary">Thuật ngữ / Từ vựng <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ví dụ: Paradigm shift" 
                required 
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="py-2.5 px-3 border-gray"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newMeaning">
              <Form.Label className="fw-semibold text-secondary">Định nghĩa / Nghĩa <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ví dụ: Sự thay đổi về nhận thức, mô hình" 
                required 
                value={newMeaning}
                onChange={(e) => setNewMeaning(e.target.value)}
                className="py-2.5 px-3 border-gray"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newExample">
              <Form.Label className="fw-semibold text-secondary">Ví dụ minh họa</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                placeholder="Ví dụ: The internet caused a paradigm shift in shopping." 
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                className="py-2.5 px-3 border-gray"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowAddWordModal(false)} className="rounded-pill px-3 fw-semibold">
              Hủy
            </Button>
            <Button variant="warning" type="submit" disabled={savingCard} className="rounded-pill px-4 fw-semibold shadow-sm">
              {savingCard ? 'Đang lưu...' : 'Thêm từ'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </main>
    </div>
  );
};

export default FlashcardStudyPage;
