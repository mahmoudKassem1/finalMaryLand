import type { Language } from '../i18n/translations';

export const formatPrice = (price: number, language: Language): string => {
  const amount = price.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: 2,
  });
  return `${amount} ${language === 'ar' ? 'ج.م' : 'EGP'}`;
};
