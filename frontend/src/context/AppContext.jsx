import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Persistence: Initialize from localStorage immediately to prevent "flash" of wrong language
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('maryland_lang') || 'en';
  });
  
  // Side Effect: Update DOM attributes and storage when language changes
  useEffect(() => {
    localStorage.setItem('maryland_lang', lang);
    
    // This is crucial for your Arabic RTL support
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Derived state: Get the correct translation object based on current lang
  const t = translations[lang] || translations['en'];

  return (
    <AppContext.Provider value={{ lang, setLang, t }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};