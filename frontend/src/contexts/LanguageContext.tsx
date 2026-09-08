import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageOption, SUPPORTED_LANGUAGES, UI_TRANSLATIONS, getTranslation } from '../utils/translations';

interface LanguageContextType {
  language: LanguageCode;
  languages: LanguageOption[];
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = 'krishidrishti_language_preference';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
