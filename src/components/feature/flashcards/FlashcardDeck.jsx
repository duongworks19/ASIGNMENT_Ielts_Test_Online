import React, { useEffect, useMemo, useState } from 'react';
import FlipCard from './FlipCard';
import FlashcardControls from './FlashcardControls';

const getSafeCards = (cards) => (Array.isArray(cards) ? cards : []);

const getCardId = (card, index) => {
  if (card && card.id) {
    return card.id;
  }

  return `flashcard-${index}`;
};

const getFrontText = (card) => {
  if (!card) {
    return '';
  }

  return card.frontText || card.word || card.term || card.vocabulary || card.question || '';
};

const getBackText = (card) => {
  if (!card) {
    return '';
  }

  return card.backText || card.meaning || card.definition || card.answer || card.translation || '';
};

const shuffleCards = (cards) => {
  const shuffledCards = [...cards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledCards[index], shuffledCards[randomIndex]] = [shuffledCards[randomIndex], shuffledCards[index]];
  }

  return shuffledCards;
};

/**
 * FlashcardDeck Component
 * Owns the local flashcard study state for current card, flip state and shuffle order.
 * @param {Array} cards - Flashcards in the current deck.
 */
const FlashcardDeck = ({ cards }) => {
  // EARS[Ubiquitous]: THE system SHALL display flashcards using a card-based UI.
  const safeCards = useMemo(() => getSafeCards(cards), [cards]);
  const [orderedCards, setOrderedCards] = useState(safeCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // EARS[State]: WHILE a Student remains in a deck, THE system SHALL preserve a safe current card position when deck data changes.
    setOrderedCards(safeCards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [safeCards]);

  const totalCards = orderedCards.length;
  const hasCards = totalCards > 0;
  const currentCard = hasCards ? orderedCards[currentIndex] : null;

  // EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an EmptyState component.
  if (!hasCards) {
    return (
      <section className="card border-0 shadow-sm text-center p-4" aria-live="polite">
        <div className="card-body">
          <h2 className="h5 mb-2">No flashcards available</h2>
          <p className="text-muted mb-0">Change the category or try another deck.</p>
        </div>
      </section>
    );
  }

  // EARS[Event]: WHEN a Student clicks a flashcard, THE system SHALL flip the card and display the opposite side.
  const handleFlip = () => {
    setIsFlipped((previousValue) => !previousValue);
  };

  // EARS[Event]: WHEN a Student clicks Next, THE system SHALL display the next flashcard.
  const handleNext = () => {
    setCurrentIndex((previousIndex) => (previousIndex + 1) % totalCards);
    setIsFlipped(false);
  };

  // EARS[Event]: WHEN a Student clicks Previous, THE system SHALL display the previous flashcard.
  const handlePrevious = () => {
    setCurrentIndex((previousIndex) => (previousIndex - 1 + totalCards) % totalCards);
    setIsFlipped(false);
  };

  // EARS[Event]: WHEN a Student clicks Shuffle, THE system SHALL randomize flashcard order.
  const handleShuffle = () => {
    if (totalCards <= 1) {
      setIsFlipped(false);
      return;
    }

    setOrderedCards((previousCards) => shuffleCards(previousCards));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <section className="card border-0 shadow-sm" aria-label="Flashcard deck">
      <div className="card-body p-3 p-md-4">
        {/* EARS[State]: WHILE a Student is viewing a flashcard, THE system SHALL maintain the current card position. */}
        <FlipCard
          key={getCardId(currentCard, currentIndex)}
          frontText={getFrontText(currentCard)}
          backText={getBackText(currentCard)}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />

        {/* EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content. */}
        <div className="mt-4">
          <FlashcardControls
            currentIndex={currentIndex}
            total={totalCards}
            onPrevious={handlePrevious}
            onShuffle={handleShuffle}
            onNext={handleNext}
          />
        </div>
      </div>
    </section>
  );
};

export default FlashcardDeck;
