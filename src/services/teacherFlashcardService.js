import axios from 'axios';

const API_URL = 'http://localhost:9999';

export const teacherFlashcardService = {
  // --- Decks ---
  getDecksByTeacher: async (teacherId) => {
    const response = await axios.get(`${API_URL}/flashcardDecks?teacherId=${teacherId}`);
    return response.data;
  },
  getDeckById: async (id) => {
    const response = await axios.get(`${API_URL}/flashcardDecks/${id}`);
    return response.data;
  },
  createDeck: async (deckData) => {
    const response = await axios.post(`${API_URL}/flashcardDecks`, deckData);
    return response.data;
  },
  updateDeck: async (id, deckData) => {
    const response = await axios.patch(`${API_URL}/flashcardDecks/${id}`, deckData);
    return response.data;
  },
  deleteDeck: async (id) => {
    const response = await axios.delete(`${API_URL}/flashcardDecks/${id}`);
    return response.data;
  },

  // --- Flashcards ---
  getCardsByDeck: async (deckId) => {
    const response = await axios.get(`${API_URL}/flashcards?deckId=${deckId}`);
    return response.data;
  },
  getCardById: async (id) => {
    const response = await axios.get(`${API_URL}/flashcards/${id}`);
    return response.data;
  },
  createCard: async (cardData) => {
    const response = await axios.post(`${API_URL}/flashcards`, cardData);
    return response.data;
  },
  updateCard: async (id, cardData) => {
    const response = await axios.patch(`${API_URL}/flashcards/${id}`, cardData);
    return response.data;
  },
  deleteCard: async (id) => {
    const response = await axios.delete(`${API_URL}/flashcards/${id}`);
    return response.data;
  }
};
