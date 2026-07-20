import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlipCard from '../../../../components/feature/flashcards/FlipCard';

/**
 * TRACEABILITY MATRIX:
 * 
 * EARS[Ubiquitous]: THE system SHALL support front-side and back-side flashcard views.
 * -> test: renders both front and back sides with provided text
 * 
 * EARS[Event]: WHEN a Student clicks a flashcard, THE system SHALL flip the card.
 * -> test: calls onFlip callback when the card is clicked
 * 
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: displays fallback values when props are missing (Unwanted pattern boundary case)
 */

describe('FlipCard Component', () => {
  
  it('renders both front and back sides with provided text', () => {
    render(<FlipCard frontText="Apple" backText="Quả táo" isFlipped={false} onFlip={jest.fn()} />);
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Quả táo')).toBeInTheDocument();
  });

  it('calls onFlip callback when the card is clicked', () => {
    const mockOnFlip = jest.fn();
    render(<FlipCard frontText="Apple" backText="Quả táo" isFlipped={false} onFlip={mockOnFlip} />);
    
    const cardContainer = screen.getByRole('button');
    fireEvent.click(cardContainer);
    
    expect(mockOnFlip).toHaveBeenCalledTimes(1);
  });

  it('applies the flipped class when isFlipped is true', () => {
    const { container } = render(<FlipCard frontText="Apple" backText="Quả táo" isFlipped={true} onFlip={jest.fn()} />);
    
    const innerCard = container.querySelector('.flip-card-inner');
    expect(innerCard).toHaveClass('flipped');
  });

  it('displays fallback values when props are missing (Unwanted pattern boundary case)', () => {
    // Missing both frontText and backText
    render(<FlipCard frontText="" backText={undefined} isFlipped={false} onFlip={jest.fn()} />);
    
    expect(screen.getByText('Front Content Missing')).toBeInTheDocument();
    expect(screen.getByText('Back Content Missing')).toBeInTheDocument();
  });

});
