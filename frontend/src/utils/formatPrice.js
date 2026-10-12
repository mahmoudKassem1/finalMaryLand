export const formatPrice = (price, language = 'en') => {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount < 0) return language === 'ar' ? 'السعر غير متاح' : 'Price unavailable';

  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const hasValidPrice = (price) => {
  if (price === null || price === undefined || price === '') return false;
  const amount = Number(price);
  return Number.isFinite(amount) && amount >= 0;
};
