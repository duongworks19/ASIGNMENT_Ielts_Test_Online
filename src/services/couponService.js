const COUPONS = {
  IELTS10: {
    code: 'IELTS10',
    label: '10% off voucher',
    type: 'percent',
    value: 10,
  },
  SAVE50: {
    code: 'SAVE50',
    label: '50.000 ₫ off',
    type: 'fixed',
    value: 50000,
  },
};

export const validateCoupon = (code) => {
  if (!code) return null;
  return COUPONS[code.trim().toUpperCase()] || null;
};

export const calculateDiscount = (amount, coupon) => {
  if (!coupon || !amount || amount <= 0) return 0;

  if (coupon.type === 'percent') {
    return Math.round((amount * coupon.value) / 100);
  }

  if (coupon.type === 'fixed') {
    return Math.min(coupon.value, amount);
  }

  return 0;
};

export const getCouponMessage = (coupon) => {
  if (!coupon) return '';
  return coupon.type === 'percent'
    ? `Áp dụng ${coupon.value}% giảm giá`
    : `Áp dụng giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.value)}`;
};
