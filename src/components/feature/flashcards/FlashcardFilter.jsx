import React from 'react';

/**
 * FlashcardFilter Component
 * Provides a dropdown to filter flashcard decks by category.
 * @param {Array} categories - Array of category objects { id, name }.
 * @param {string} selectedCategoryId - The currently selected category ID.
 * @param {function} onSelectCategory - Callback when a new category is selected.
 */
const FlashcardFilter = ({ categories, selectedCategoryId, onSelectCategory }) => {
  // EARS[Ubiquitous]: THE system SHALL allow students to filter flashcard decks by category.

  // EARS[Unwanted]: WHERE the category list is empty or fails to load, THE system SHALL disable the filter and display a fallback option.
  const isEmpty = !categories || categories.length === 0;

  // EARS[Event]: WHEN a Student selects a category, THE system SHALL update the filter selection.
  const handleChange = (e) => {
    if (onSelectCategory) {
      onSelectCategory(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="categoryFilter" className="form-label fw-bold text-body-strong">
        Select Topic
      </label>
      <select
        id="categoryFilter"
        className="form-select shadow-sm"
        value={selectedCategoryId || ''}
        onChange={handleChange}
        disabled={isEmpty}
        aria-label="Filter flashcards by category"
      >
        {isEmpty ? (
          <option value="">No categories available</option>
        ) : (
          <>
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name || category.title || 'Untitled deck'}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
};

export default FlashcardFilter;
