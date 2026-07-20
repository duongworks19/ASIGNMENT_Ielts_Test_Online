const WISHLIST_STORAGE_KEY = 'ielts_wishlist';
const event = new Event('wishlist:changed');

const safeParse = (value) => {
  try {
    return JSON.parse(value) || [];
  } catch {
    return [];
  }
};

export const getWishlistItems = () => {
  return safeParse(localStorage.getItem(WISHLIST_STORAGE_KEY));
};

export const isInWishlist = (courseId) => {
  return getWishlistItems().includes(courseId);
};

export const addToWishlist = (courseId) => {
  const items = getWishlistItems();
  if (!items.includes(courseId)) {
    items.push(courseId);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(event);
  }
  return items;
};

export const removeFromWishlist = (courseId) => {
  const items = getWishlistItems().filter((id) => id !== courseId);
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(event);
  return items;
};

export const clearWishlist = () => {
  localStorage.removeItem(WISHLIST_STORAGE_KEY);
  window.dispatchEvent(event);
};

export const subscribeWishlistChanges = (listener) => {
  window.addEventListener('wishlist:changed', listener);
  return () => window.removeEventListener('wishlist:changed', listener);
};
