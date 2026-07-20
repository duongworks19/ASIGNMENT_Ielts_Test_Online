import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardListPage from './FlashcardListPage';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * TRACEABILITY MATRIX:
 *
 * EARS[Event]: WHEN a Student navigates to `/learning/flashcards`, THE system SHALL load available flashcard decks.
 * -> test: renders loading state then displays flashcard decks from API data
 *
 * EARS[Ubiquitous]: THE system SHALL allow students to browse and select flashcard decks.
 * -> test: renders deck cards with names, card counts and Start deck actions
 *
 * EARS[Event]: WHEN a Student selects a category filter, THE system SHALL display flashcards matching that category.
 * -> test: filters the deck list by selected category
 *
 * EARS[Event]: WHEN a Student opens a flashcard deck, THE system SHALL load deck flashcards.
 * -> test: clicking Start deck navigates to `/learning/flashcards/:deckId`
 *
 * EARS[Event]: WHEN flashcard data is loading, THE system SHALL display a loading state.
 * -> test: shows loading state before API resolves
 *
 * EARS[Event]: WHEN flashcard data cannot be loaded, THE system SHALL display a readable error message.
 * -> test: shows error alert when API request fails
 *
 * EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an EmptyState component.
 * -> test: shows empty state when categories API returns an empty list
 *
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: handles non-array API payloads and incomplete category data safely
 */

jest.mock('../../services/api', () => ({
  get: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

describe('FlashcardListPage', () => {
  const navigateMock = jest.fn();

  const categories = [
    { id: 'cat-001', name: 'Environment', description: 'Vocabulary about nature.' },
    { id: 'cat-002', name: 'Technology', description: 'Vocabulary about innovation.' }
  ];

  const flashcards = [
    { id: 'flashcard-001', categoryId: 'cat-001', word: 'Climate' },
    { id: 'flashcard-002', categoryId: 'cat-001', word: 'Recycle' },
    { id: 'flashcard-003', categoryId: 'cat-002', word: 'Automation' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
  });

  const mockApiSuccess = (categoryData = categories, flashcardData = flashcards) => {
    api.get
      .mockResolvedValueOnce({ data: categoryData })
      .mockResolvedValueOnce({ data: flashcardData });
  };

  it('renders loading state then displays flashcard decks from API data', async () => {
    mockApiSuccess();

    render(<FlashcardListPage />);

    expect(screen.getByTestId('flashcard-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Environment' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Technology' })).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/categories');
    expect(api.get).toHaveBeenCalledWith('/flashcards');
  });

  it('renders deck cards with names, card counts and Start deck actions', async () => {
    mockApiSuccess();

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-deck-list')).toBeInTheDocument();
    });

    expect(screen.getByText('Vocabulary about nature.')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary about innovation.')).toBeInTheDocument();
    expect(screen.getByText('2 cards')).toBeInTheDocument();
    expect(screen.getByText('1 cards')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open environment/i })).toBeInTheDocument();
  });

  it('filters the deck list by selected category', async () => {
    mockApiSuccess();

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Environment' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/filter flashcards by category/i), {
      target: { value: 'cat-002' }
    });

    expect(screen.queryByRole('heading', { name: 'Environment' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Technology' })).toBeInTheDocument();
    expect(screen.getByText('1 cards')).toBeInTheDocument();
  });

  it('clicking Start deck navigates to `/learning/flashcards/:deckId`', async () => {
    mockApiSuccess();

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open environment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open environment/i }));

    expect(navigateMock).toHaveBeenCalledWith('/learning/flashcards/cat-001');
  });

  it('shows error alert when API request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Khong the tai danh sach flashcard. Vui long thu lai sau.')).toBeInTheDocument();
  });

  it('shows not-found message when categories request returns 404', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Khong tim thay bo flashcard yeu cau.')).toBeInTheDocument();
  });

  it('shows empty state when categories API returns an empty list', async () => {
    mockApiSuccess([], flashcards);

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('Khong tim thay flashcard phu hop.')).toBeInTheDocument();
  });

  it('handles non-array API payloads and incomplete category data safely', async () => {
    mockApiSuccess([{ id: 'cat-003' }], { invalid: true });

    render(<FlashcardListPage />);

    await waitFor(() => {
      expect(screen.getByText('Untitled deck')).toBeInTheDocument();
    });

    expect(screen.getByText('Practice IELTS vocabulary with this topic.')).toBeInTheDocument();
    expect(screen.getByText('0 cards')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open untitled deck/i })).toBeInTheDocument();
  });
});
