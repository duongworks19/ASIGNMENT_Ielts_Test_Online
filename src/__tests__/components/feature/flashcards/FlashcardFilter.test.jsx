import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlashcardFilter from '../../../../components/feature/flashcards/FlashcardFilter';

/**
 * TRACEABILITY MATRIX:
 * 
 * EARS[Ubiquitous]: THE system SHALL allow students to filter flashcard decks by category.
 * -> test: renders the select dropdown with "All Categories" and provided categories
 * 
 * EARS[Event]: WHEN a Student selects a category, THE system SHALL update the filter selection.
 * -> test: calls onSelectCategory when a different option is selected
 * 
 * EARS[Unwanted]: WHERE the category list is empty or fails to load, THE system SHALL disable the filter and display a fallback option.
 * -> test: disables the dropdown and shows fallback when categories are empty
 * -> test: disables the dropdown and shows fallback when categories are undefined
 */

describe('FlashcardFilter Component', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Environment' },
    { id: 'cat-2', name: 'Technology' }
  ];

  it('renders the select dropdown with "All Categories" and provided categories', () => {
    render(
      <FlashcardFilter 
        categories={mockCategories} 
        selectedCategoryId="all" 
        onSelectCategory={jest.fn()} 
      />
    );

    const select = screen.getByLabelText(/filter flashcards by category/i);
    expect(select).toBeInTheDocument();
    expect(select).not.toBeDisabled();

    // Check options
    expect(screen.getByRole('option', { name: 'All Categories' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Environment' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Technology' })).toBeInTheDocument();
  });

  it('calls onSelectCategory when a different option is selected', () => {
    const mockOnSelect = jest.fn();
    render(
      <FlashcardFilter 
        categories={mockCategories} 
        selectedCategoryId="all" 
        onSelectCategory={mockOnSelect} 
      />
    );

    const select = screen.getByLabelText(/filter flashcards by category/i);
    fireEvent.change(select, { target: { value: 'cat-2' } });

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('cat-2');
  });

  it('disables the dropdown and shows fallback when categories are empty (Unwanted pattern)', () => {
    render(
      <FlashcardFilter 
        categories={[]} 
        selectedCategoryId="" 
        onSelectCategory={jest.fn()} 
      />
    );

    const select = screen.getByLabelText(/filter flashcards by category/i);
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: 'No categories available' })).toBeInTheDocument();
  });

  it('disables the dropdown and shows fallback when categories are undefined (Unwanted pattern)', () => {
    render(
      <FlashcardFilter 
        categories={undefined} 
        selectedCategoryId="" 
        onSelectCategory={jest.fn()} 
      />
    );

    const select = screen.getByLabelText(/filter flashcards by category/i);
    expect(select).toBeDisabled();
    expect(screen.getByRole('option', { name: 'No categories available' })).toBeInTheDocument();
  });
});
