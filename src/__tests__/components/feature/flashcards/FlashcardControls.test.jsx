import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardControls from '../../../../components/feature/flashcards/FlashcardControls';

/**
 * TRACEABILITY MATRIX:
 *
 * EARS[Ubiquitous]: THE system SHALL support responsive UI from mobile width to desktop width.
 * -> test: renders Previous, Shuffle and Next buttons with Bootstrap classes
 *
 * EARS[State]: WHILE a Student is viewing a flashcard, THE system SHALL maintain the current card position.
 * -> test: displays the current one-based card position and total count
 *
 * EARS[Event]: WHEN a Student clicks Previous, THE system SHALL display the previous flashcard.
 * -> test: calls onPrevious when Previous is clicked
 *
 * EARS[Event]: WHEN a Student clicks Shuffle, THE system SHALL randomize flashcard order.
 * -> test: calls onShuffle when Shuffle is clicked
 *
 * EARS[Event]: WHEN a Student clicks Next, THE system SHALL display the next flashcard.
 * -> test: calls onNext when Next is clicked
 *
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: renders a safe 0 / 0 position when props are missing
 * -> test: clamps invalid and out-of-range indexes to a valid position
 *
 * EARS[Unwanted]: WHERE a deck has no flashcards, THE system SHALL keep navigation actions disabled instead of crashing.
 * -> test: disables all controls when total is zero
 *
 * EARS[Unwanted]: WHERE a deck contains only one flashcard, THE system SHALL keep shuffle safe and non-destructive.
 * -> test: disables Shuffle for a single-card deck while keeping navigation safe
 *
 * EARS[State]: WHILE an API request is pending, THE system SHALL prevent duplicate save actions.
 * -> test: disables controls when the external disabled flag is true
 */

describe('FlashcardControls Component', () => {
  it('renders Previous, Shuffle and Next buttons with Bootstrap classes', () => {
    render(<FlashcardControls currentIndex={1} total={5} />);

    expect(screen.getByRole('navigation', { name: /flashcard navigation controls/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous flashcard/i })).toHaveClass('btn', 'btn-outline-secondary');
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toHaveClass('btn', 'btn-outline-primary');
    expect(screen.getByRole('button', { name: /next flashcard/i })).toHaveClass('btn', 'btn-primary');
  });

  it('displays the current one-based card position and total count', () => {
    render(<FlashcardControls currentIndex={2} total={8} />);

    expect(screen.getByText('Card 3 / 8')).toBeInTheDocument();
  });

  it('calls onPrevious when Previous is clicked', () => {
    const onPrevious = jest.fn();
    render(<FlashcardControls currentIndex={2} total={5} onPrevious={onPrevious} />);

    fireEvent.click(screen.getByRole('button', { name: /previous flashcard/i }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls onShuffle when Shuffle is clicked', () => {
    const onShuffle = jest.fn();
    render(<FlashcardControls currentIndex={2} total={5} onShuffle={onShuffle} />);

    fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));

    expect(onShuffle).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Next is clicked', () => {
    const onNext = jest.fn();
    render(<FlashcardControls currentIndex={2} total={5} onNext={onNext} />);

    fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders a safe 0 / 0 position when props are missing (Unwanted pattern boundary case)', () => {
    render(<FlashcardControls />);

    expect(screen.getByText('Card 0 / 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous flashcard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next flashcard/i })).toBeDisabled();
  });

  it('clamps invalid and out-of-range indexes to a valid position (Unwanted pattern boundary case)', () => {
    const { rerender } = render(<FlashcardControls currentIndex={99} total={5} />);

    expect(screen.getByText('Card 5 / 5')).toBeInTheDocument();

    rerender(<FlashcardControls currentIndex={-4} total={5} />);
    expect(screen.getByText('Card 1 / 5')).toBeInTheDocument();

    rerender(<FlashcardControls currentIndex="not-a-number" total={5} />);
    expect(screen.getByText('Card 1 / 5')).toBeInTheDocument();
  });

  it('disables all controls when total is zero (Unwanted pattern boundary case)', () => {
    render(<FlashcardControls currentIndex={0} total={0} />);

    expect(screen.getByText('Card 0 / 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous flashcard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next flashcard/i })).toBeDisabled();
  });

  it('disables Shuffle for a single-card deck while keeping navigation safe (Unwanted pattern boundary case)', () => {
    render(<FlashcardControls currentIndex={0} total={1} />);

    expect(screen.getByText('Card 1 / 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous flashcard/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next flashcard/i })).not.toBeDisabled();
  });

  it('disables controls when the external disabled flag is true', () => {
    render(<FlashcardControls currentIndex={1} total={3} disabled />);

    expect(screen.getByRole('button', { name: /previous flashcard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /shuffle flashcards/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next flashcard/i })).toBeDisabled();
  });

  it('does not crash when callbacks are missing (Unwanted pattern boundary case)', () => {
    render(<FlashcardControls currentIndex={1} total={3} />);

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /previous flashcard/i }));
      fireEvent.click(screen.getByRole('button', { name: /shuffle flashcards/i }));
      fireEvent.click(screen.getByRole('button', { name: /next flashcard/i }));
    }).not.toThrow();
  });
});
