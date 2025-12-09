
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';
import { Customer, Sample } from '../types';
import { MOCK_CUSTOMERS, MOCK_SAMPLES } from '../services/dataService';

export type FontSize = 'small' | 'medium' | 'large';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: (theme: 'light' | 'dark') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  t: (key: keyof typeof translations['en']) => string;
  
  // Data State
  customers: Customer[];
  samples: Sample[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setSamples: (samples: Sample[] | ((prev: Sample[]) => Sample[])) => void;
  clearDatabase: () => void;
  isDemoData: boolean;
  setIsDemoData: (isDemo: boolean) => void;
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

  // Font Size State
  // Default is 'large' because user said current size is Large
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const savedSize = localStorage.getItem('fontSize');
    return (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') ? savedSize : 'large';
  });

  // Company Name State
  const [companyName, setCompanyNameState] = useState<string>(() => {
    return localStorage.getItem('companyName') || 'Navi Material';
  });

  // Data State with Persistence
  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    return localStorage.getItem('isDemoData') !== 'false'; // Default true unless explicitly false
  });

  const [customers, setCustomersState] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
  });

  const [samples, setSamplesState] = useState<Sample[]>(() => {
    const saved = localStorage.getItem('samples');
    return saved ? JSON.parse(saved) : MOCK_SAMPLES;
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

  // Apply Root Font Size
  useEffect(() => {
    const root = window.document.documentElement;
    // Current design is "Large". Large = 100% (16px).
    // Medium = 90% (approx 14.4px).
    // Small = 80% (approx 12.8px).
    let sizeValue = '100%';
    if (fontSize === 'medium') sizeValue = '90%';
    if (fontSize === 'small') sizeValue = '80%';
    
    root.style.fontSize = sizeValue;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Persist Data Changes
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('samples', JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem('isDemoData', String(isDemoData));
  }, [isDemoData]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  }

  const setCompanyName = (name: string) => {
    setCompanyNameState(name);
    localStorage.setItem('companyName', name);
  }

  const setCustomers = (val: Customer[] | ((prev: Customer[]) => Customer[])) => {
    setCustomersState(val);
  };

  const setSamples = (val: Sample[] | ((prev: Sample[]) => Sample[])) => {
    setSamplesState(val);
  };

  const clearDatabase = () => {
    setCustomersState([]);
    setSamplesState([]);
    setIsDemoData(false); // It's no longer demo data, it's empty data
    localStorage.removeItem('customers');
    localStorage.removeItem('samples');
    localStorage.setItem('isDemoData', 'false');
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme, 
      language, setLanguage,
      fontSize, setFontSize,
      companyName, setCompanyName, 
      t,
      customers, setCustomers,
      samples, setSamples,
      clearDatabase,
      isDemoData, setIsDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
