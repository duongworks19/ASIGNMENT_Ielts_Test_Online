const CART_STORAGE_KEY = 'ielts_cart';
const event = new Event('cart:changed');

const safeParse = (value) => {
  try {
    return JSON.parse(value) || [];
  } catch {
    return [];
  }
};

export const getCartItems = () => {
  return safeParse(localStorage.getItem(CART_STORAGE_KEY));
};

export const isInCart = (courseId) => {
  return getCartItems().includes(courseId);
};

export const addToCart = (courseId) => {
  const items = getCartItems();
  if (!items.includes(courseId)) {
    items.push(courseId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(event);
  }
  return items;
};

export const removeFromCart = (courseId) => {
  const items = getCartItems().filter((id) => id !== courseId);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(event);
  return items;
};

export const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(event);
};

export const setCartItems = (courseIds = []) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...new Set(courseIds)]));
  window.dispatchEvent(event);
};

export const subscribeCartChanges = (listener) => {
  window.addEventListener('cart:changed', listener);
  return () => window.removeEventListener('cart:changed', listener);
};
