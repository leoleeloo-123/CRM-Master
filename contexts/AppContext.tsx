import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: (theme: 'light' | 'dark') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });
  
  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang === 'en' || savedLang === 'zh') ? savedLang : 'en';
  });

  // Company Name State
  const [companyName, setCompanyNameState] = useState<string>(() => {
    return localStorage.getItem('companyName') || 'Navi Material';
  });

  // Initial system preference check
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
  }, []);

  // Update HTML class for Tailwind dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }

  const setCompanyName = (name: string) => {
    setCompanyNameState(name);
    localStorage.setItem('companyName', name);
  }

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, companyName, setCompanyName, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};