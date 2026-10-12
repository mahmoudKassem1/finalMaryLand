// src/context/LanguageContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationPath, translations } from '../i18n/translations';

type LanguageContextType = {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (path: TranslationPath, params?: Record<string, string | number>) => string;
  isLoadingLanguage: boolean;
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isRTL: false,
  setLanguage: async () => {},
  t: (path) => path,
  isLoadingLanguage: true,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);

  useEffect(() => {
    // Load saved language on startup
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        if (savedLang === 'en' || savedLang === 'ar') {
          setLanguageState(savedLang);
        }
      } catch (e) {
        console.warn('Failed to load language', e);
      } finally {
        setIsLoadingLanguage(false);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('user_language', lang);
    } catch (e) {
      console.warn('Failed to save language', e);
    }
  };

  const t = (path: TranslationPath, params?: Record<string, string | number>) => {
    const lookup = (tree: unknown): unknown =>
      path.split('.').reduce<unknown>((value, key) => {
        if (value && typeof value === 'object' && key in value) {
          return (value as Record<string, unknown>)[key];
        }
        return undefined;
      }, tree);
    const value = lookup(translations[language]) ?? lookup(translations.en);
    if (typeof value !== 'string') return path;
    return Object.entries(params ?? {}).reduce(
      (text, [key, replacement]) => text.replaceAll(`{{${key}}}`, String(replacement)),
      value
    );
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL: language === 'ar', setLanguage, t, isLoadingLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);