import React, { useState, useEffect, useCallback } from 'react';
import './FlashcardLearn.css';

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

const FlashcardLearn = ({ cards = [], deckName, onExit }) => {
  // --- STATE ---
  const [roundCards, setRoundCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weakCards, setWeakCards] = useState([]); // Array of card objects
  
  const [currentOptions, setCurrentOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false); // true when user clicked an answer and we are showing feedback
  const [isCorrectHit, setIsCorrectHit] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [cardResults, setCardResults] = useState([]); // track result for progress bar ('success' or 'warning')
  
  const [isBossRound, setIsBossRound] = useState(false);
  const [showBossIntro, setShowBossIntro] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (cards.length > 0) {
      setRoundCards(shuffleArray(cards));
      setCurrentIndex(0);
      setCardResults([]);
    }
  }, [cards]);

  // --- GENERATE OPTIONS ---
  const generateOptions = useCallback((correctCard, allCards) => {
    if (!correctCard) return [];
    
    // Pick 3 random wrong answers
    const wrongAnswers = allCards.filter(c => c.id !== correctCard.id);
    const shuffledWrong = shuffleArray(wrongAnswers);
    const selectedWrong = shuffledWrong.slice(0, 3);
    
    // If not enough cards in deck, pad with dummy answers
    while (selectedWrong.length < 3) {
      selectedWrong.push({
        id: `dummy-${Math.random()}`,
        isDummy: true,
        word: `Dummy Answer ${selectedWrong.length + 1}`,
        meaning: `Dummy Definition ${selectedWrong.length + 1}`
      });
    }

    const options = shuffleArray([correctCard, ...selectedWrong]);
    return options;
  }, []);

  // --- SETUP QUESTION ---
  useEffect(() => {
    if (currentIndex < roundCards.length) {
      const currentCard = roundCards[currentIndex];
      setCurrentOptions(generateOptions(currentCard, cards));
      setSelectedOption(null);
      setIsAnswering(false);
      setStartTime(Date.now());
    }
  }, [currentIndex, roundCards, cards, generateOptions]);

  // --- CHECK ROUND OVER ---
  useEffect(() => {
    if (roundCards.length > 0 && currentIndex >= roundCards.length) {
      if (weakCards.length > 0 && !isBossRound) {
        setShowBossIntro(true);
      } else {
        setIsFinished(true);
      }
    }
  }, [currentIndex, roundCards.length, weakCards.length, isBossRound]);

  // Global keydown listener for "Press any key to continue"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnswering && !isCorrectHit) {
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswering, isCorrectHit]);

  // --- HANDLERS ---
  const currentCard = roundCards[currentIndex];

  const handleNextQuestion = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const markCardAsWeak = () => {
    if (!weakCards.find(c => c.id === currentCard.id)) {
      setWeakCards(prev => [...prev, currentCard]);
    }
    const newResults = [...cardResults];
    newResults[currentIndex] = 'warning';
    setCardResults(newResults);
  };

  const markCardAsSuccess = () => {
    const newResults = [...cardResults];
    newResults[currentIndex] = 'success';
    setCardResults(newResults);
  };

  const handleOptionClick = (option) => {
    if (isAnswering) return;

    setIsAnswering(true);
    setSelectedOption(option);
    const isCorrect = option.id === currentCard.id;

    if (isCorrect) {
      setIsCorrectHit(true);
      markCardAsSuccess();
      
      // Auto advance
      setTimeout(() => {
        handleNextQuestion();
      }, 500); // Quick delay to show green feedback briefly
    } else {
      setIsCorrectHit(false);
      markCardAsWeak();
    }
  };

  const handleDontKnow = () => {
    if (isAnswering) return;
    setIsAnswering(true);
    setIsCorrectHit(false);
    setSelectedOption(null); // No specific option was chosen
    markCardAsWeak();
  };

  const startBossRound = () => {
    setIsBossRound(true);
    setShowBossIntro(false);
    setRoundCards(shuffleArray(weakCards));
    setCurrentIndex(0);
    setCardResults([]);
    setWeakCards([]); // Reset weak cards for boss round
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- RENDERERS ---
  if (cards.length === 0) return null;

  if (isFinished) {
    return (
      <div className="finish-screen card border-0 shadow-sm mt-4">
        <h2 className="mb-4 text-success fw-bold">🎉 Chúc mừng!</h2>
        <p className="fs-5 mb-4 text-muted">Bạn đã hoàn thành xuất sắc vòng ôn tập này!</p>
        <button className="btn btn-primary btn-lg rounded-pill px-5" onClick={onExit}>
          Quay lại Thẻ ghi nhớ
        </button>
      </div>
    );
  }

  if (showBossIntro) {
    return (
      <div className="boss-intro card border-0 shadow-sm mt-4">
        <h2>⚠️ BOSS CHALLENGE ⚠️</h2>
        <p className="fs-5 mb-4">Bạn có {weakCards.length} từ vựng cần phải vượt qua lại.</p>
        <p className="text-muted mb-5">Đây là những từ bạn đã trả lời sai hoặc gặp khó khăn. Hãy đánh bại chúng!</p>
        <button className="btn btn-danger btn-lg rounded-pill px-5 fw-bold shadow" onClick={startBossRound}>
          Bắt đầu khiêu chiến
        </button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className={`learn-mode-container mt-4 ${isBossRound ? 'boss-round-active' : ''}`}>
      
      {/* Header & Progress */}
      <div className="learn-header">
        <div className="learn-progress">
          <div className={`progress-number ${cardResults[currentIndex] || ''}`}>
            {currentIndex + 1}
          </div>
          <div className="progress-bar-container">
            {roundCards.map((_, i) => {
              let bgColor = '#d9dde8';
              if (i < currentIndex) {
                bgColor = cardResults[i] === 'warning' ? '#ffaa70' : '#23b26d';
              } else if (i === currentIndex) {
                bgColor = '#4255ff';
              }
              return (
                <div key={i} className="progress-segment" style={{ backgroundColor: bgColor }}></div>
              );
            })}
          </div>
          <div className="progress-number">{roundCards.length}</div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="learn-card">
        <div className="learn-card-header">
          Thuật ngữ 
          <button className="btn btn-link p-0 text-secondary ms-2" onClick={() => handleSpeak(getCardLabel(currentCard))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>
        
        <h3 className="learn-question">{getCardLabel(currentCard)}</h3>

        <div className={`feedback-message ${isAnswering && !isCorrectHit ? 'warning' : isAnswering && isCorrectHit ? 'success' : ''}`}>
          {isAnswering && !isCorrectHit ? 'Đừng lo, bạn vẫn đang học mà!' : isAnswering && isCorrectHit ? 'Chính xác!' : 'Chọn đáp án đúng'}
        </div>

        {/* Options Grid */}
        <div className="options-grid">
          {currentOptions.map((option, idx) => {
            const isCorrect = option.id === currentCard.id;
            const isSelected = selectedOption?.id === option.id;
            
            let btnClass = 'option-btn';
            let IconNumber = <span className="option-number">{idx + 1}</span>;

            if (isAnswering) {
              if (isCorrect) {
                btnClass += ' correct-reveal';
                IconNumber = <span className="option-number"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>;
              } else if (isSelected) {
                btnClass += ' wrong-reveal';
                IconNumber = <span className="option-number"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>;
              } else {
                btnClass += ' disabled';
              }
            }

            return (
              <button 
                key={`${option.id}-${idx}`}
                className={btnClass}
                disabled={isAnswering}
                onClick={() => handleOptionClick(option)}
              >
                {IconNumber}
                <span className="option-text">{getCardMeaning(option)}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="learn-footer">
          <button className="btn btn-outline-secondary rounded-pill fw-semibold" onClick={onExit}>
            Thoát
          </button>
          
          {!isAnswering ? (
            <button className="dont-know-btn" onClick={handleDontKnow}>
              Bạn không biết? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </button>
          ) : (
            !isCorrectHit && (
              <button className="continue-btn" onClick={handleNextQuestion}>
                Tiếp tục
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default FlashcardLearn;
