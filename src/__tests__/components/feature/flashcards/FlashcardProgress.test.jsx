import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardProgress from '../../../../components/feature/flashcards/FlashcardProgress';

/**
 * TRACEABILITY MATRIX:
 *
 * EARS[Ubiquitous]: THE system SHALL provide visual indication of learning status.
 * -> test: renders known, review, remaining and total counts with Bootstrap progress segments
 *
 * EARS[State]: WHILE a flashcard is marked Known, THE system SHALL visually indicate mastered status.
 * -> test: renders the Known segment with Bootstrap success styling
 *
 * EARS[State]: WHILE a flashcard is marked Review, THE system SHALL visually indicate review status.
 * -> test: renders the Review segment with Bootstrap warning styling
 *
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: renders zero-value fallback state when props are missing
 *
 * EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an empty progress state instead of broken percentages.
 * -> test: renders empty progress state when total is zero
 *
 * EARS[Unwanted]: WHERE duplicate or invalid status counts exceed the deck total, THE system SHALL avoid displaying impossible progress values.
 * -> test: clamps negative counts to zero
 * -> test: clamps known and review counts so they never exceed total
 */

describe('FlashcardProgress Component', () => {
  it('renders known, review, remaining and total counts with Bootstrap progress segments', () => {
    render(<FlashcardProgress total={10} knownCount={4} reviewCount={3} />);

    expect(screen.getByText('4 known, 3 review, 3 remaining')).toBeInTheDocument();
    expect(screen.getByText('Total: 10')).toBeInTheDocument();
    expect(screen.getByText('Known: 4')).toBeInTheDocument();
    expect(screen.getByText('Review: 3')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 3')).toBeInTheDocument();

    const progress = screen.getByRole('progressbar', { name: /flashcard learning progress/i });
    expect(progress).toHaveAttribute('aria-valuenow', '7');
    expect(progress).toHaveAttribute('aria-valuemax', '10');

    expect(progress.querySelector('.bg-success')).toHaveStyle({ width: '40%' });
    expect(progress.querySelector('.bg-warning')).toHaveStyle({ width: '30%' });
    expect(progress.querySelector('.bg-secondary')).toHaveStyle({ width: '30%' });
  });

  it('renders the Known segment with Bootstrap success styling', () => {
    render(<FlashcardProgress total={5} knownCount={2} reviewCount={0} />);

    const progress = screen.getByRole('progressbar', { name: /flashcard learning progress/i });
    expect(progress.querySelector('.progress-bar.bg-success')).toBeInTheDocument();
    expect(screen.getByText('Known: 2')).toBeInTheDocument();
  });

  it('renders the Review segment with Bootstrap warning styling', () => {
    render(<FlashcardProgress total={5} knownCount={0} reviewCount={2} />);

    const progress = screen.getByRole('progressbar', { name: /flashcard learning progress/i });
    expect(progress.querySelector('.progress-bar.bg-warning')).toBeInTheDocument();
    expect(screen.getByText('Review: 2')).toBeInTheDocument();
  });

  it('renders zero-value fallback state when props are missing (Unwanted pattern boundary case)', () => {
    render(<FlashcardProgress />);

    expect(screen.getByText('0 known, 0 review, 0 remaining')).toBeInTheDocument();
    expect(screen.getByText('Total: 0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Chua co flashcard de hien thi tien do.');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders empty progress state when total is zero (Unwanted pattern boundary case)', () => {
    render(<FlashcardProgress total={0} knownCount={5} reviewCount={5} />);

    expect(screen.getByText('0 known, 0 review, 0 remaining')).toBeInTheDocument();
    expect(screen.getByText('Total: 0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Chua co flashcard de hien thi tien do.');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('clamps negative counts to zero (Unwanted pattern boundary case)', () => {
    render(<FlashcardProgress total={8} knownCount={-2} reviewCount={-3} />);

    expect(screen.getByText('0 known, 0 review, 8 remaining')).toBeInTheDocument();
    expect(screen.getByText('Known: 0')).toBeInTheDocument();
    expect(screen.getByText('Review: 0')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 8')).toBeInTheDocument();
  });

  it('clamps known and review counts so they never exceed total (Unwanted pattern boundary case)', () => {
    render(<FlashcardProgress total={6} knownCount={5} reviewCount={5} />);

    expect(screen.getByText('5 known, 1 review, 0 remaining')).toBeInTheDocument();
    expect(screen.getByText('Known: 5')).toBeInTheDocument();
    expect(screen.getByText('Review: 1')).toBeInTheDocument();
    expect(screen.getByText('Remaining: 0')).toBeInTheDocument();

    const progress = screen.getByRole('progressbar', { name: /flashcard learning progress/i });
    expect(progress).toHaveAttribute('aria-valuenow', '6');
    expect(progress.querySelector('.bg-secondary')).toHaveStyle({ width: '0%' });
  });
});
