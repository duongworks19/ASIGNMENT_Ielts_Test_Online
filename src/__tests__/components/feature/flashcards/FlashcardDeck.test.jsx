import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardDeck from '../../../../components/feature/flashcards/FlashcardDeck';

/**
 * TRACEABILITY MATRIX:
 *
 * EARS[Ubiquitous]: THE system SHALL display flashcards using a card-based UI.
 * -> test: renders the first flashcard with FlipCard and FlashcardControls
 *
 * EARS[Event]: WHEN a Student clicks a flashcard, THE system SHALL flip the card and display the opposite side.
 * -> test: toggles aria-pressed when the current flashcard is clicked
 *
 * EARS[Event]: WHEN a Student clicks Next, THE system SHALL display the next flashcard.
 * -> test: moves to the next flashcard and resets flip state
 * -> test: wraps from the last flashcard back to the first flashcard
 *
 * EARS[Event]: WHEN a Student clicks Previous, THE system SHALL display the previous flashcard.
 * -> test: moves to the previous flashcard and resets flip state
 * -> test: wraps from the first flashcard to the last flashcard
 *
 * EARS[Event]: WHEN a Student clicks Shuffle, THE system SHALL randomize flashcard order.
 * -> test: shuffles the deck safely, resets to card position 1 and clears flip state
 *
 * EARS[State]: WHILE a Student is viewing a flashcard, THE system SHALL maintain the current card position.
 * -> test: updates the position badge as students navigate
 *
 * EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an EmptyState component.
 * -> test: renders an empty state when cards is empty or invalid
 *
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: displays FlipCard fallback values for incomplete card data
 *
 * Edge Case: Single Flashcard Deck
 * -> test: keeps Next and Previous safe for a single-card deck
 *
 * Edge Case: Shuffle Repeatedly
 * -> test: repeated shuffle clicks do not crash the deck
 */

describe('FlashcardDeck Component', () => {
  const mockCards = [
    { id: 'flashcard-001', word: 'Analyze', meaning: 'Examine carefully' },
    { id: 'flashcard-002', word: 'Assess', meaning: 'Evaluate' },
    { id: 'flashcard-003', word: 'Context', meaning: 'Surrounding situation' }
  ];

  const getFlipCardButton = () => (
    screen.getAllByRole('button').find((button) => button.hasAttribute('aria-pressed'))
  );

  it('renders the first flashcard with FlipCard and FlashcardControls', () => {
    render(<FlashcardDeck cards={mockCards} />);

    expect(screen.getByRole('region', { name: /flashcard deck/i })).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Examine carefully')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous flashcard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next flashcard/i })).toBeInTheDocument();
  });

  it('toggles aria-pressed when the current flashcard is clicked', () => {
    render(<FlashcardDeck cards={mockCards} />);

    const flipCardButton = getFlipCardButton();
    expect(flipCardButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(flipCardButton);
    expect(flipCardButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves to the next flashcard and resets flip state', () => {
    render(<FlashcardDeck cards={mockCards} />);

    fireEvent.click(getFlipCardButton());
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));

    expect(screen.getByText('Assess')).toBeInTheDocument();
    expect(screen.getByText('Evaluate')).toBeInTheDocument();
    expect(screen.getByText('Card 2 / 3')).toBeInTheDocument();
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('wraps from the last flashcard back to the first flashcard', () => {
    render(<FlashcardDeck cards={mockCards} />);

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));
    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Card 3 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));

    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 3')).toBeInTheDocument();
  });

  it('moves to the previous flashcard and resets flip state', () => {
    render(<FlashcardDeck cards={mockCards} />);

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));
    fireEvent.click(getFlipCardButton());
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /previous flashcard/i }));

    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 3')).toBeInTheDocument();
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('wraps from the first flashcard to the last flashcard', () => {
    render(<FlashcardDeck cards={mockCards} />);

    fireEvent.click(screen.getByRole('button', { name: /previous flashcard/i }));

    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Card 3 / 3')).toBeInTheDocument();
  });

  it('shuffles the deck safely, resets to card position 1 and clears flip state', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    render(<FlashcardDeck cards={mockCards} />);

    fireEvent.click(getFlipCardButton());
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));

    expect(screen.getByText('Card 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Assess')).toBeInTheDocument();
    expect(getFlipCardButton()).toHaveAttribute('aria-pressed', 'false');

    randomSpy.mockRestore();
  });

  it('renders an empty state when cards is empty or invalid (Unwanted pattern boundary case)', () => {
    const { rerender } = render(<FlashcardDeck cards={[]} />);

    expect(screen.getByText('No flashcards available')).toBeInTheDocument();
    expect(screen.getByText('Change the category or try another deck.')).toBeInTheDocument();

    rerender(<FlashcardDeck cards={undefined} />);
    expect(screen.getByText('No flashcards available')).toBeInTheDocument();
  });

  it('displays FlipCard fallback values for incomplete card data (Unwanted pattern boundary case)', () => {
    render(<FlashcardDeck cards={[{ id: 'flashcard-empty' }]} />);

    expect(screen.getByText('Front Content Missing')).toBeInTheDocument();
    expect(screen.getByText('Back Content Missing')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 1')).toBeInTheDocument();
  });

  it('keeps Next and Previous safe for a single-card deck', () => {
    render(<FlashcardDeck cards={[mockCards[0]]} />);

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /previous flashcard/i }));
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Card 1 / 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeDisabled();
  });

  it('repeated shuffle clicks do not crash the deck', () => {
    render(<FlashcardDeck cards={mockCards} />);

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));
      fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));
      fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));
    }).not.toThrow();

    expect(screen.getByText(/Card 1 \/ 3/)).toBeInTheDocument();
  });
});
