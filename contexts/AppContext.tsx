
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';
import { Customer, Sample, MasterProduct, TagOptions, Exhibition } from '../types';
import { MOCK_CUSTOMERS, MOCK_SAMPLES, MOCK_MASTER_PRODUCTS } from '../services/dataService';

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
  userName: string;
  setUserName: (name: string) => void;
  t: (key: keyof typeof translations['en']) => string;
  
  // Data State
  customers: Customer[];
  samples: Sample[];
  masterProducts: MasterProduct[];
  exhibitions: Exhibition[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setSamples: (samples: Sample[] | ((prev: Sample[]) => Sample[])) => void;
  setExhibitions: (exhibitions: Exhibition[] | ((prev: Exhibition[]) => Exhibition[])) => void;
  syncSampleToCatalog: (sample: Partial<Sample>) => void;
  
  // Tag Management
  tagOptions: TagOptions;
  setTagOptions: (tags: TagOptions | ((prev: TagOptions) => TagOptions)) => void;
  refreshTagsFromSamples: (samples: Sample[], replace?: boolean) => void;
  
  clearDatabase: () => void;
  isDemoData: boolean;
  setIsDemoData: (isDemo: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_TAGS: TagOptions = {
  sampleStatus: ['已申请', '处理中', '已寄出', '已送达', '测试中', '已反馈', '已关闭'],
  crystalType: ['单晶', '多晶'],
  productCategory: ['团聚', '纳米金刚石', '球形金刚石', '金刚石球', '微米粉', 'CVD'],
  productForm: ['微粉', '悬浮液'],
  eventSeries: ['Semicon', 'Optical Expo', 'Industrial Fair']
};

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
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const savedSize = localStorage.getItem('fontSize');
    return (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') ? savedSize : 'large';
  });

  // Company Name State
  const [companyName, setCompanyNameState] = useState<string>(() => {
    return localStorage.getItem('companyName') || 'Navi Material';
  });

  // User Name State
  const [userName, setUserNameState] = useState<string>(() => {
    const saved = localStorage.getItem('userName');
    return saved !== null ? saved : 'User';
  });

  // Data State with Persistence
  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    return localStorage.getItem('isDemoData') !== 'false';
  });

  const [customers, setCustomersState] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
  });

  const [samples, setSamplesState] = useState<Sample[]>(() => {
    const saved = localStorage.getItem('samples');
    return saved ? JSON.parse(saved) : MOCK_SAMPLES;
  });
  
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>(() => {
    const saved = localStorage.getItem('masterProducts');
    return saved ? JSON.parse(saved) : MOCK_MASTER_PRODUCTS;
  });

  // CRITICAL FIX: Ensure eventSeries is always an array when loading from storage
  const [exhibitions, setExhibitionsState] = useState<Exhibition[]>(() => {
    const saved = localStorage.getItem('exhibitions');
    if (!saved) return [];
    try {
      const parsed: Exhibition[] = JSON.parse(saved);
      return parsed.map(exh => ({
        ...exh,
        eventSeries: Array.isArray(exh.eventSeries) ? exh.eventSeries : []
      }));
    } catch (e) {
      return [];
    }
  });
  
  // Tag Options State
  const [tagOptions, setTagOptionsState] = useState<TagOptions>(() => {
    const saved = localStorage.getItem('tagOptions');
    if (!saved) return DEFAULT_TAGS;
    try {
      const parsed: TagOptions = JSON.parse(saved);
      return {
        ...DEFAULT_TAGS,
        ...parsed,
        eventSeries: Array.isArray(parsed.eventSeries) ? parsed.eventSeries : DEFAULT_TAGS.eventSeries
      };
    } catch (e) {
      return DEFAULT_TAGS;
    }
  });

  // --- Effects for Data Sync ---

  // 1. Sync Exhibitions from Customers' Tags
  useEffect(() => {
    const uniqueTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));
    if (uniqueTags.length === 0) return;

    setExhibitionsState(prev => {
      let hasChanged = false;
      const updated = [...prev];
      
      uniqueTags.forEach(tagName => {
        const exists = updated.find(e => e.name === tagName);
        if (!exists) {
          updated.push({
            id: `exh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: tagName,
            date: '',
            location: 'TBD',
            link: '#',
            eventSeries: []
          });
          hasChanged = true;
        }
      });

      return hasChanged ? updated : prev;
    });
  }, [customers]);

  // 2. Sync Event Series tags from Exhibitions data
  useEffect(() => {
    const usedSeries = Array.from(new Set(exhibitions.flatMap(e => e.eventSeries || [])));
    if (usedSeries.length === 0) return;

    setTagOptionsState(prev => {
      const existingSeries = new Set(prev.eventSeries);
      const newFoundSeries = usedSeries.filter(s => s && !existingSeries.has(s));
      
      if (newFoundSeries.length === 0) return prev;
      
      return {
        ...prev,
        eventSeries: [...prev.eventSeries, ...newFoundSeries]
      };
    });
  }, [exhibitions]);

  // --- Effects for Persistence ---

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    let sizeValue = '100%';
    if (fontSize === 'medium') sizeValue = '90%';
    if (fontSize === 'small') sizeValue = '80%';
    root.style.fontSize = sizeValue;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('companyName', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('samples', JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem('masterProducts', JSON.stringify(masterProducts));
  }, [masterProducts]);

  useEffect(() => {
    localStorage.setItem('exhibitions', JSON.stringify(exhibitions));
  }, [exhibitions]);

  useEffect(() => {
    localStorage.setItem('isDemoData', String(isDemoData));
  }, [isDemoData]);

  useEffect(() => {
    localStorage.setItem('tagOptions', JSON.stringify(tagOptions));
  }, [tagOptions]);

  // --- Setters ---

  const toggleTheme = (newTheme: 'light' | 'dark') => setTheme(newTheme);
  const setLanguage = (lang: Language) => setLanguageState(lang);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setCompanyName = (name: string) => setCompanyNameState(name);
  const setUserName = (name: string) => setUserNameState(name);
  const setCustomers = (val: Customer[] | ((prev: Customer[]) => Customer[])) => setCustomersState(val);
  const setSamples = (val: Sample[] | ((prev: Sample[]) => Sample[])) => setSamplesState(val);
  const setExhibitions = (val: Exhibition[] | ((prev: Exhibition[]) => Exhibition[])) => setExhibitionsState(val);
  const setTagOptions = (val: TagOptions | ((prev: TagOptions) => TagOptions)) => setTagOptionsState(val);

  // --- Logic ---

  const refreshTagsFromSamples = (sampleList: Sample[], replace: boolean = false) => {
    setTagOptionsState(prev => {
      const newTags = replace ? {
          sampleStatus: [],
          crystalType: [],
          productCategory: [],
          productForm: [],
          eventSeries: [...prev.eventSeries]
      } : { 
          sampleStatus: [...prev.sampleStatus],
          crystalType: [...prev.crystalType],
          productCategory: [...prev.productCategory],
          productForm: [...prev.productForm],
          eventSeries: [...prev.eventSeries]
      };
      
      const addUnique = (list: string[], item: string) => {
         if (item && !list.includes(item)) list.push(item);
      };

      sampleList.forEach(s => {
        if (s.status) addUnique(newTags.sampleStatus, s.status);
        if (s.crystalType) addUnique(newTags.crystalType, s.crystalType);
        if (s.productForm) addUnique(newTags.productForm, s.productForm);
        if (s.productCategory) {
           s.productCategory.forEach(cat => addUnique(newTags.productCategory, cat));
        }
      });
      return newTags;
    });
  };

  const syncSampleToCatalog = (sample: Partial<Sample>) => {
    const catStr = sample.productCategory?.join(', ') || '';
    const crystal = sample.crystalType || '';
    const form = sample.productForm || '';
    const orig = sample.originalSize || '';
    const proc = sample.processedSize ? ` > ${sample.processedSize}` : '';
    
    const generatedName = `${crystal} ${catStr} ${form} - ${orig}${proc}`;
    
    setMasterProducts(prev => {
      const exists = prev.find(p => p.productName === generatedName);
      if (exists) return prev;
      
      const newProduct: MasterProduct = {
        id: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productName: generatedName,
        crystalType: sample.crystalType!,
        productCategory: sample.productCategory || [],
        productForm: sample.productForm!,
        originalSize: sample.originalSize!,
        processedSize: sample.processedSize
      };
      
      return [...prev, newProduct];
    });
    
    return generatedName;
  };

  const clearDatabase = () => {
    setCustomersState([]);
    setSamplesState([]);
    setMasterProducts([]);
    setExhibitionsState([]);
    setIsDemoData(false);
    setTagOptionsState(DEFAULT_TAGS); 
    localStorage.removeItem('customers');
    localStorage.removeItem('samples');
    localStorage.removeItem('masterProducts');
    localStorage.removeItem('exhibitions');
    localStorage.setItem('isDemoData', 'false');
    localStorage.setItem('tagOptions', JSON.stringify(DEFAULT_TAGS));
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
      userName, setUserName,
      t,
      customers, setCustomers,
      samples, setSamples,
      exhibitions, setExhibitions,
      masterProducts, syncSampleToCatalog,
      clearDatabase,
      isDemoData, setIsDemoData,
      tagOptions, setTagOptions, refreshTagsFromSamples
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
