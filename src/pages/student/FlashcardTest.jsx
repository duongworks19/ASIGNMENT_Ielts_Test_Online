import React, { useState, useEffect, useCallback } from 'react';
import './FlashcardTest.css';

const getCardLabel = (card) => card?.word || card?.frontText || card?.term || card?.vocabulary || '';
const getCardMeaning = (card) => card?.meaning || card?.backText || card?.definition || card?.translation || '';

// Utility to shuffle array
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Check if written answer is correct
const isWrittenCorrect = (userAns, correctLabel) => {
  if (!userAns || !correctLabel) return false;
  return userAns.toString().toLowerCase().trim() === correctLabel.toString().toLowerCase().trim();
};

const FlashcardTest = ({ cards = [], deckName, onExit }) => {
  const [mode, setMode] = useState('setup'); // 'setup', 'taking', 'results'
  const [numQuestions, setNumQuestions] = useState(Math.min(20, cards.length));
  
  // Setup Toggles
  const [qTypes, setQTypes] = useState({
    mcq: true,
    tf: false,
    written: false
  });
  
  // Test Data
  const [testQuestions, setTestQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // { qIndex: value }
  const [score, setScore] = useState({ correct: 0, incorrect: 0, percentage: 0 });

  // Generate options for MCQ
  const generateMcqOptions = useCallback((correctCard, allCards) => {
    if (!correctCard) return [];
    const wrongAnswers = allCards.filter(c => c.id !== correctCard.id);
    const shuffledWrong = shuffleArray(wrongAnswers);
    const selectedWrong = shuffledWrong.slice(0, 3);
    
    while (selectedWrong.length < 3) {
      selectedWrong.push({
        id: `dummy-${Math.random()}`,
        isDummy: true,
        word: `Dummy Answer ${selectedWrong.length + 1}`,
        meaning: `Dummy Definition ${selectedWrong.length + 1}`
      });
    }

    return shuffleArray([correctCard, ...selectedWrong]);
  }, []);

  const handleToggleType = (type) => {
    setQTypes(prev => {
      const next = { ...prev, [type]: !prev[type] };
      // Prevent disabling all
      if (!next.mcq && !next.tf && !next.written) return prev;
      return next;
    });
  };

  const startTest = () => {
    const enabledTypes = Object.keys(qTypes).filter(k => qTypes[k]);
    const selectedCards = shuffleArray(cards).slice(0, numQuestions);
    
    const questions = selectedCards.map(card => {
      // Randomly pick an enabled type for this card
      const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
      
      let qData = { type, correctCard: card };
      
      if (type === 'mcq') {
        qData.options = generateMcqOptions(card, cards);
      } else if (type === 'tf') {
        // 50% chance to be true
        const isTrue = Math.random() > 0.5;
        let promptCard = card;
        if (!isTrue) {
          const wrongAnswers = cards.filter(c => c.id !== card.id);
          promptCard = wrongAnswers.length > 0 
            ? wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)] 
            : { meaning: 'Dummy wrong meaning' };
        }
        qData.isTrue = isTrue;
        qData.promptCard = promptCard;
      }
      // written type only needs correctCard
      
      return qData;
    });
    
    setTestQuestions(questions);
    setUserAnswers({});
    setMode('taking');
  };

  const handleOptionSelect = (questionIndex, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const submitTest = () => {
    let correct = 0;
    testQuestions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (q.type === 'mcq') {
        if (ans === q.correctCard.id) correct++;
      } else if (q.type === 'tf') {
        if (ans === q.isTrue) correct++;
      } else if (q.type === 'written') {
        if (isWrittenCorrect(ans, getCardLabel(q.correctCard))) correct++;
      }
    });
    
    const total = testQuestions.length;
    const incorrect = total - correct;
    const percentage = Math.round((correct / total) * 100) || 0;
    
    setScore({ correct, incorrect, percentage });
    setMode('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const isQuestionCorrect = (q, ans) => {
    if (q.type === 'mcq') return ans === q.correctCard.id;
    if (q.type === 'tf') return ans === q.isTrue;
    if (q.type === 'written') return isWrittenCorrect(ans, getCardLabel(q.correctCard));
    return false;
  };

  if (cards.length === 0) return null;

  // --- SETUP SCREEN ---
  if (mode === 'setup') {
    return (
      <div className="test-setup-screen">
        <div className="test-setup-card">
          <h2>Thiết lập bài kiểm tra</h2>
          
          <div className="setup-form-group">
            <label>Số lượng câu hỏi (tối đa {cards.length})</label>
            <input 
              type="number" 
              className="form-control"
              value={numQuestions}
              min="1"
              max={cards.length}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                if (val > cards.length) val = cards.length;
                setNumQuestions(val);
              }}
            />
          </div>

          <div className="setup-form-group mt-4">
            <label>Loại câu hỏi</label>
            
            <div className="setup-toggle" onClick={() => handleToggleType('mcq')}>
              <label>Trắc nghiệm (Multiple choice)</label>
              <div className="form-check form-switch m-0">
                <input className="form-check-input" type="checkbox" role="switch" checked={qTypes.mcq} readOnly />
              </div>
            </div>
            
            <div className="setup-toggle" onClick={() => handleToggleType('tf')}>
              <label>Đúng/Sai (True/False)</label>
              <div className="form-check form-switch m-0">
                <input className="form-check-input" type="checkbox" role="switch" checked={qTypes.tf} readOnly />
              </div>
            </div>
            
            <div className="setup-toggle" onClick={() => handleToggleType('written')}>
              <label>Tự luận (Written)</label>
              <div className="form-check form-switch m-0">
                <input className="form-check-input" type="checkbox" role="switch" checked={qTypes.written} readOnly />
              </div>
            </div>
          </div>

          <button className="btn-start-test" onClick={startTest}>
            Bắt đầu làm bài
          </button>
        </div>
      </div>
    );
  }

  // --- TAKING SCREEN ---
  if (mode === 'taking') {
    return (
      <div className="test-mode-container mt-4">
        <div className="test-taking-header">
          <div>
            <h3 className="mb-1">{deckName}</h3>
            <span className="text-muted">{testQuestions.length} câu hỏi tổng hợp</span>
          </div>
          <button className="btn-submit-test" onClick={submitTest}>
            Nộp bài
          </button>
        </div>

        <div className="question-list">
          {testQuestions.map((q, qIndex) => {
            
            const questionHeader = (
              <div className="question-header">
                <div className="question-number">
                  {q.type === 'mcq' && 'Trắc nghiệm'}
                  {q.type === 'tf' && 'Đúng / Sai'}
                  {q.type === 'written' && 'Tự luận'}
                </div>
                <div className="question-number">{qIndex + 1} của {testQuestions.length}</div>
              </div>
            );

            // MCQ Renderer
            if (q.type === 'mcq') {
              const letters = ['A', 'B', 'C', 'D'];
              return (
                <div className="question-item" key={`q-${qIndex}`}>
                  {questionHeader}
                  <h4 className="question-text">
                    {getCardLabel(q.correctCard)}
                    <button className="btn btn-link p-0 text-secondary ms-2" onClick={() => handleSpeak(getCardLabel(q.correctCard))}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                  </h4>
                  <div className="mcq-options">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = userAnswers[qIndex] === opt.id;
                      return (
                        <div 
                          key={opt.id} 
                          className={`mcq-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionSelect(qIndex, opt.id)}
                        >
                          <div className="mcq-option-letter">{letters[optIndex]}</div>
                          <div>{getCardMeaning(opt)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // TF Renderer
            if (q.type === 'tf') {
              const isSelectedTrue = userAnswers[qIndex] === true;
              const isSelectedFalse = userAnswers[qIndex] === false;
              return (
                <div className="question-item" key={`q-${qIndex}`}>
                  {questionHeader}
                  <h4 className="question-text">
                    {getCardLabel(q.correctCard)}
                    <button className="btn btn-link p-0 text-secondary ms-2" onClick={() => handleSpeak(getCardLabel(q.correctCard))}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                  </h4>
                  <div className="question-definition">
                    {getCardMeaning(q.promptCard)}
                  </div>
                  <div className="tf-options">
                    <div 
                      className={`tf-option ${isSelectedTrue ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(qIndex, true)}
                    >Đúng</div>
                    <div 
                      className={`tf-option ${isSelectedFalse ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(qIndex, false)}
                    >Sai</div>
                  </div>
                </div>
              );
            }

            // Written Renderer
            if (q.type === 'written') {
              return (
                <div className="question-item" key={`q-${qIndex}`}>
                  {questionHeader}
                  <div className="question-definition text-dark fw-medium border-0 mb-4 pb-0">
                    {getCardMeaning(q.correctCard)}
                  </div>
                  <input 
                    type="text" 
                    className="written-input"
                    placeholder="Gõ đáp án bằng tiếng Anh (Thuật ngữ)..."
                    value={userAnswers[qIndex] || ''}
                    onChange={(e) => handleOptionSelect(qIndex, e.target.value)}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="text-center mt-5 mb-5">
          <button className="btn-submit-test px-5 py-3" onClick={submitTest}>
            Nộp bài kiểm tra
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (mode === 'results') {
    const conicGradient = `conic-gradient(#10b981 ${score.percentage}%, #f1f5f9 ${score.percentage}% 100%)`;

    return (
      <div className="test-mode-container mt-4">
        <div className="test-taking-header">
          <div>
            <h3 className="mb-1">Kết quả kiểm tra: {deckName}</h3>
            <span className="text-muted fw-semibold">{score.correct} / {testQuestions.length} • {score.percentage}%</span>
          </div>
          <button className="btn btn-outline-secondary rounded-pill" onClick={onExit}>
            Đóng
          </button>
        </div>

        <div className="test-results-screen mt-5">
          {/* Left Sidebar */}
          <div className="results-sidebar d-none d-lg-flex">
            <div className="text-muted small fw-bold mb-3 text-uppercase">Danh sách</div>
            {testQuestions.map((q, idx) => {
              const isCorrect = isQuestionCorrect(q, userAnswers[idx]);
              return (
                <div className="sidebar-item" key={`sidebar-${idx}`}>
                  {isCorrect ? (
                    <svg className="sidebar-icon correct" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg className="sidebar-icon incorrect" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  )}
                  <span>Câu {idx + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="results-main">
            <div className="results-summary">
              <h2>{score.percentage >= 80 ? 'Xuất sắc, bạn làm rất tốt!' : 'Đừng lo lắng, bạn sẽ tiến bộ!'}</h2>
              <p className="text-muted fw-medium fs-5">Hãy ôn tập lại các câu đã làm sai nhé.</p>
              
              <div className="results-stats-box">
                <div className="donut-chart" style={{ background: conicGradient }}>
                  <div className="donut-inner">{score.percentage}%</div>
                </div>
                <div className="stats-details">
                  <div className="stat-row">
                    <span className="stat-label correct">Đúng</span>
                    <span className="stat-value correct">{score.correct}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label incorrect">Sai</span>
                    <span className="stat-value incorrect">{score.incorrect}</span>
                  </div>
                </div>
              </div>
            </div>

            <h4 className="fw-bold mb-4 mt-5 border-bottom pb-2">Đáp án của bạn</h4>
            
            <div className="review-list">
              {testQuestions.map((q, qIndex) => {
                const ans = userAnswers[qIndex];
                const isCorrect = isQuestionCorrect(q, ans);

                return (
                  <div className="review-item" key={`review-${qIndex}`}>
                    <div className="review-term">
                      <div className="text-muted small fw-bold mb-2">Thuật ngữ</div>
                      <div className="mb-3 fs-5 fw-medium text-dark">{getCardLabel(q.correctCard)}</div>
                      
                      {!isCorrect && (
                        <div className="mt-3">
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2 py-1">Bạn đã trả lời sai</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="review-options">
                      <div className="text-muted small fw-bold mb-2">Chi tiết đáp án</div>
                      
                      {q.type === 'mcq' && q.options.map((opt) => {
                        const isCorrectOption = opt.id === q.correctCard.id;
                        const isUserChoice = ans === opt.id;
                        
                        let optionClass = 'neutral';
                        if (isCorrectOption) optionClass = 'correct';
                        else if (isUserChoice && !isCorrectOption) optionClass = 'wrong-selected';

                        return (
                          <div className={`review-option ${optionClass}`} key={`rev-opt-${opt.id}`}>
                            <span>{getCardMeaning(opt)}</span>
                            {isCorrectOption && (
                              <svg className="ms-auto flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                            {isUserChoice && !isCorrectOption && (
                              <svg className="ms-auto flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            )}
                          </div>
                        );
                      })}

                      {q.type === 'tf' && (
                        <div>
                          <div className="mb-2 text-muted">Định nghĩa được đưa ra: <br/><span className="text-dark fw-medium">{getCardMeaning(q.promptCard)}</span></div>
                          <div className="mt-3">
                            Lựa chọn của bạn: 
                            {ans === undefined ? <span className="fw-bold ms-2 text-muted">Chưa chọn</span> : (
                              <span className={`fw-bold ms-2 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                                {ans ? 'ĐÚNG' : 'SAI'}
                              </span>
                            )}
                          </div>
                          {!isCorrect && (
                            <div className="mt-2 p-3 bg-light rounded border border-success-subtle text-success">
                              <div className="small text-uppercase fw-bold mb-1">Thực ra đáp án là:</div>
                              <div className="fw-medium">{q.isTrue ? 'ĐÚNG' : 'SAI'}</div>
                              {!q.isTrue && (
                                <div className="mt-2 small text-muted">
                                  Vì định nghĩa đúng phải là: <br/><span className="text-dark fw-medium">{getCardMeaning(q.correctCard)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {q.type === 'written' && (
                        <div>
                          <div className="mb-2 text-muted">Định nghĩa: <br/><span className="text-dark fw-medium">{getCardMeaning(q.correctCard)}</span></div>
                          <div className="mt-3">
                            Bạn gõ: 
                            <span className={`ms-2 written-review-text ${isCorrect ? 'text-success' : 'strike'}`}>
                              {ans || '(Bỏ trống)'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div className="mt-2 p-3 bg-light rounded border border-success-subtle text-success">
                              <div className="small text-uppercase fw-bold mb-1">Đáp án đúng:</div>
                              <div className="fw-medium fs-5">{getCardLabel(q.correctCard)}</div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-5 mb-5">
              <button className="btn btn-primary btn-lg rounded-pill px-5 fw-bold" onClick={() => setMode('setup')}>
                Tạo bài kiểm tra mới
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default FlashcardTest;
