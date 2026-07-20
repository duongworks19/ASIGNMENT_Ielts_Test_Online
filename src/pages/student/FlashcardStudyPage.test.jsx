import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardStudyPage from './FlashcardStudyPage';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * TRACEABILITY MATRIX:
 *
 * EARS[Event]: WHEN a Student opens a flashcard deck, THE system SHALL load deck flashcards.
 * -> test: renders deck data, FlashcardDeck and FlashcardProgress after API success
 *
 * EARS[Event]: WHEN flashcard data is loading, THE system SHALL display a loading state.
 * -> test: shows loading state before requests resolve
 *
 * EARS[State]: WHILE a flashcard is marked Known, THE system SHALL visually indicate mastered status.
 * -> test: existing known/review progress is reflected in progress counts and status rows
 *
 * EARS[Event]: WHEN a Student marks a flashcard as Known, THE system SHALL save status as `known`.
 * -> test: creates a new known progress record with POST
 *
 * EARS[Event]: WHEN a Student marks a flashcard as Review, THE system SHALL save status as `review`.
 * -> test: updates an existing progress record with PATCH
 *
 * EARS[Event]: WHEN a Student updates flashcard status, THE system SHALL persist progress through the API.
 * -> test: disables duplicate actions while save is pending
 *
 * EARS[Unwanted]: WHERE flashcard progress cannot be saved, THE system SHALL display an error notification.
 * -> test: shows save error and rolls back optimistic progress on save failure
 *
 * EARS[Unwanted]: WHERE a requested flashcard deck does not exist, THE system SHALL display a not-found state.
 * -> test: shows not-found message when deck request returns 404
 *
 * EARS[State]: WHILE JSON-Server is unavailable, THE system SHALL display a connection error instead of crashing.
 * -> test: shows connection error when API request fails
 *
 * EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an EmptyState component.
 * -> test: shows empty state when deck has no cards
 *
 * EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
 * -> test: handles invalid progress payload and incomplete card data safely
 */

jest.mock('../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}));

jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn()
}));

describe('FlashcardStudyPage', () => {
  const navigateMock = jest.fn();
  const deck = { id: 'cat-001', name: 'Environment' };
  const cards = [
    { id: 'flashcard-001', categoryId: 'cat-001', word: 'Climate', meaning: 'Weather pattern' },
    { id: 'flashcard-002', categoryId: 'cat-001', word: 'Recycle', meaning: 'Reuse material' }
  ];
  const progress = [
    { id: 'fp-001', userId: 'student-001', flashcardId: 'flashcard-001', status: 'known' },
    { id: 'fp-stale', userId: 'student-001', flashcardId: 'deleted-card', status: 'review' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ deckId: 'cat-001' });
    useNavigate.mockReturnValue(navigateMock);
    getCurrentUser.mockReturnValue({ id: 'student-001', role: 'student' });
  });

  const mockLoadSuccess = ({
    deckData = deck,
    cardData = cards,
    progressData = progress
  } = {}) => {
    api.get
      .mockResolvedValueOnce({ data: deckData })
      .mockResolvedValueOnce({ data: cardData })
      .mockResolvedValueOnce({ data: progressData });
  };

  it('renders deck data, FlashcardDeck and FlashcardProgress after API success', async () => {
    mockLoadSuccess();

    render(<FlashcardStudyPage />);

    expect(screen.getByTestId('flashcard-study-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Environment' })).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/categories/cat-001');
    expect(api.get).toHaveBeenCalledWith('/flashcards?categoryId=cat-001');
    expect(api.get).toHaveBeenCalledWith('/flashcardProgress?userId=student-001');
    expect(screen.getByRole('group', { name: /update climate status/i })).toBeInTheDocument();
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    expect(screen.getByText('1 known, 0 review, 1 remaining')).toBeInTheDocument();
  });

  it('existing known/review progress is reflected in progress counts and status rows', async () => {
    mockLoadSuccess({
      progressData: [
        { id: 'fp-001', userId: 'student-001', flashcardId: 'flashcard-001', status: 'known' },
        { id: 'fp-002', userId: 'student-001', flashcardId: 'flashcard-002', status: 'review' }
      ]
    });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('1 known, 1 review, 0 remaining')).toBeInTheDocument();
    });

    expect(screen.getByText('Status: known')).toBeInTheDocument();
    expect(screen.getByText('Status: review')).toBeInTheDocument();
  });

  it('creates a new known progress record with POST', async () => {
    mockLoadSuccess({ progressData: [] });
    api.post.mockResolvedValueOnce({
      data: { id: 'fp-new', userId: 'student-001', flashcardId: 'flashcard-002', status: 'known' }
    });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Recycle')).toBeInTheDocument();
    });

    const recycleGroup = screen.getByRole('group', { name: /update recycle status/i });
    fireEvent.click(recycleGroup.querySelector('.btn-outline-success'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/flashcardProgress', {
        userId: 'student-001',
        flashcardId: 'flashcard-002',
        status: 'known'
      });
    });

    expect(screen.getByText('1 known, 0 review, 1 remaining')).toBeInTheDocument();
  });

  it('updates an existing progress record with PATCH', async () => {
    mockLoadSuccess();
    api.patch.mockResolvedValueOnce({
      data: { id: 'fp-001', userId: 'student-001', flashcardId: 'flashcard-001', status: 'review' }
    });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /update climate status/i })).toBeInTheDocument();
    });

    const climateGroup = screen.getByRole('group', { name: /update climate status/i });
    fireEvent.click(climateGroup.querySelector('.btn-outline-warning'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/flashcardProgress/fp-001', { status: 'review' });
    });

    expect(screen.getByText('0 known, 1 review, 1 remaining')).toBeInTheDocument();
  });

  it('disables duplicate actions while save is pending', async () => {
    mockLoadSuccess({ progressData: [] });
    let resolvePost;
    api.post.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Recycle')).toBeInTheDocument();
    });

    const recycleGroup = screen.getByRole('group', { name: /update recycle status/i });
    fireEvent.click(recycleGroup.querySelector('.btn-outline-success'));
    fireEvent.click(recycleGroup.querySelector('.btn-outline-warning'));

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    resolvePost({
      data: { id: 'fp-new', userId: 'student-001', flashcardId: 'flashcard-002', status: 'known' }
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Saving...' })).not.toBeInTheDocument();
    });
  });

  it('shows save error and rolls back optimistic progress on save failure', async () => {
    mockLoadSuccess({ progressData: [] });
    api.post.mockRejectedValueOnce(new Error('Save failed'));

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Recycle')).toBeInTheDocument();
    });

    const recycleGroup = screen.getByRole('group', { name: /update recycle status/i });
    fireEvent.click(recycleGroup.querySelector('.btn-outline-success'));

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-save-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Khong the luu tien do hoc tap.')).toBeInTheDocument();
    expect(screen.getByText('0 known, 0 review, 2 remaining')).toBeInTheDocument();
  });

  it('shows not-found message when deck request returns 404', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-study-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Bo flashcard khong ton tai.')).toBeInTheDocument();
  });

  it('shows connection error when API request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-study-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Khong the ket noi may chu. Vui long thu lai sau.')).toBeInTheDocument();
  });

  it('shows empty state when deck has no cards', async () => {
    mockLoadSuccess({ cardData: [], progressData: [] });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByTestId('flashcard-study-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('Chua co flashcard de hien thi.')).toBeInTheDocument();
  });

  it('handles invalid progress payload and incomplete card data safely', async () => {
    mockLoadSuccess({
      cardData: [{ id: 'flashcard-empty', categoryId: 'cat-001' }],
      progressData: { invalid: true }
    });

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Flashcard 1')).toBeInTheDocument();
    });

    expect(screen.getByText('0 known, 0 review, 1 remaining')).toBeInTheDocument();
    expect(screen.getByText('Front Content Missing')).toBeInTheDocument();
  });

  it('shows not-found state when route param is missing', async () => {
    useParams.mockReturnValue({});

    render(<FlashcardStudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Bo flashcard khong ton tai.')).toBeInTheDocument();
    });

    expect(api.get).not.toHaveBeenCalled();
  });
});
