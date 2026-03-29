
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations, getCanonicalTag } from '../utils/i18n';
import { Customer, Sample, MasterProduct, TagOptions, Exhibition, Interaction, Expense, FXRate } from '../types';
import { MOCK_CUSTOMERS, MOCK_SAMPLES, MOCK_MASTER_PRODUCTS, MOCK_EXHIBITIONS, MOCK_EXPENSES, MOCK_FXRATES } from '../services/dataService';
import { customersApi, samplesApi, exhibitionsApi, expensesApi, fxRatesApi } from '../services/apiClient';
import { format } from 'date-fns';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'warm' | 'dark-green';

export const parseInteractionSummary = (summary: string) => {
  const result = {
    isStarred: false,
    typeTag: '无',
    exhibitionTag: 'None', 
    effectTag: '无',
    content: summary
  };

  if (!summary) return result;

  if (summary.startsWith('(标星记录)')) {
    result.isStarred = true;
    result.content = result.content.replace('(标星记录)', '');
  } else if (summary.startsWith('(一般记录)')) {
    result.content = result.content.replace('(一般记录)', '');
  }

  const typeMatch = result.content.match(/^<(.*?)>/);
  if (typeMatch) {
    const rawType = typeMatch[1];
    result.typeTag = getCanonicalTag(rawType); 
    result.content = result.content.replace(typeMatch[0], '');
  }

  const exhMatch = result.content.match(/^\/\/(.*?)(?=\{|$)/);
  if (exhMatch) {
    result.exhibitionTag = exhMatch[1];
    result.content = result.content.replace(`//${result.exhibitionTag}`, '');
  }

  const effectMatch = result.content.match(/^{(.*?)}/);
  if (effectMatch) {
    const rawEffect = effectMatch[1];
    result.effectTag = getCanonicalTag(rawEffect);
    result.content = result.content.replace(effectMatch[0], '');
  }

  result.content = result.content.trim();
  return result;
};

const REPLY_TAGS = ['Customer Reply', 'Customer Reply & Follow-up', '对方回复', '对方回复及我方跟进'];
const FOLLOWUP_TAGS = ['Our Follow-up', 'Customer Reply & Follow-up', '我方跟进', '对方回复及我方跟进'];

export const getComputedDatesForCustomer = (interactions: Interaction[]) => {
  const sorted = [...interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastContact = sorted.length > 0 ? sorted[0].date : undefined;
  let lastCustomerReply = undefined;
  for (const int of sorted) {
    const { effectTag } = parseInteractionSummary(int.summary);
    if (REPLY_TAGS.includes(effectTag)) { lastCustomerReply = int.date; break; }
  }
  let lastMyReply = undefined;
  for (const int of sorted) {
    const { effectTag } = parseInteractionSummary(int.summary);
    if (FOLLOWUP_TAGS.includes(effectTag)) { lastMyReply = int.date; break; }
  }
  return { lastContact, lastCustomerReply, lastMyReply };
};

interface AppContextType {
  theme: ThemeMode;
  toggleTheme: (theme: ThemeMode) => void;
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
  expenses: Expense[];
  fxRates: FXRate[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setSamples: (samples: Sample[] | ((prev: Sample[]) => Sample[])) => void;
  setExhibitions: (exhibitions: Exhibition[] | ((prev: Exhibition[]) => Exhibition[])) => void;
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => void;
  setFxRates: (rates: FXRate[] | ((prev: FXRate[]) => FXRate[])) => void;
  syncSampleToCatalog: (sample: Partial<Sample>) => void;
  refreshAllCustomerDates: () => void;
  updateGlobalFXRates: () => Promise<void>;
  
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
  sampleStatus: ['等待中', '样品制作中', '样品已发出', '客户初步测试', '客户初步结果'],
  crystalType: ['单晶', '多晶'],
  productCategory: ['团聚', '纳米金刚石', '球形金刚石', '金刚石球', '微米粉', 'CVD'],
  productForm: ['微粉', '悬浮液'],
  eventSeries: ['Semicon', 'Optical Expo', 'Industrial Fair'],
  interactionTypes: ['无', '对方邮件', '我方邮件', '双方邮件', '展会相见', '视频会议', '线下会面'],
  interactionEffects: ['无', '对方回复', '我方跟进', '对方回复及我方跟进'],
  feeStatus: ['等待中', '待付款', '已付款'],
  expenseCategory: ['差旅费用', '展会摊位', '样品运输', '材料采购', '日常运营', '研发投入', '其他支出']
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    return (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'warm' || savedTheme === 'dark-green') ? savedTheme : 'light';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang === 'en' || savedLang === 'zh') ? savedLang : 'en';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const savedSize = localStorage.getItem('fontSize');
    return (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') ? savedSize : 'large';
  });

  const [companyName, setCompanyNameState] = useState<string>(() => {
    return localStorage.getItem('companyName') || 'Zenith Advanced Materials';
  });

  const [userName, setUserNameState] = useState<string>(() => {
    const saved = localStorage.getItem('userName');
    return saved !== null ? saved : 'Demo User';
  });

  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    return localStorage.getItem('isDemoData') !== 'false';
  });

  // Storage mode detection
  const [storageMode, setStorageMode] = useState<'team' | 'local'>(() => {
    return (localStorage.getItem('crm_storage_mode') as 'team' | 'local') || 'local';
  });

  // Initialize all state with empty arrays - don't use MOCK data by default
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [samples, setSamplesState] = useState<Sample[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [exhibitions, setExhibitionsState] = useState<Exhibition[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [fxRates, setFxRatesState] = useState<FXRate[]>([]);
  const [tagOptions, setTagOptionsState] = useState<TagOptions>(DEFAULT_TAGS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load all data based on storage mode
  useEffect(() => {
    const loadAllData = async () => {
      // Reset all state when switching modes to ensure clean separation
      setCustomersState([]);
      setSamplesState([]);
      setMasterProducts([]);
      setExhibitionsState([]);
      setExpensesState([]);
      setFxRatesState([]);
      setTagOptionsState(DEFAULT_TAGS);
      
      if (storageMode === 'team') {
        try {
          // Team Mode: Load all data from Supabase
          const [customersData, samplesData, exhibitionsData] = await Promise.all([
            customersApi.getAll(),
            samplesApi.getAll(),
            exhibitionsApi.getAll()
          ]);
          // Team Mode: use Supabase data only, no fallback to MOCK or localStorage
          setCustomersState(customersData || []);
          setSamplesState(samplesData || []);
          setExhibitionsState(exhibitionsData || []);
        } catch (err) {
          console.error('Failed to load from API:', err);
          // Team Mode: on error, show empty state - don't fallback to local data
          setCustomersState([]);
          setSamplesState([]);
          setExhibitionsState([]);
        }
        // TODO: Load masterProducts, expenses, fxRates from Supabase when APIs are ready
      } else {
        // Local mode - load from localStorage only
        const savedCustomers = localStorage.getItem('customers');
        const savedSamples = localStorage.getItem('samples');
        const savedMasterProducts = localStorage.getItem('masterProducts');
        const savedExhibitions = localStorage.getItem('exhibitions');
        const savedExpenses = localStorage.getItem('expenses');
        const savedFxRates = localStorage.getItem('fxRates');
        const savedTagOptions = localStorage.getItem('tagOptions');
        
        setCustomersState(savedCustomers ? JSON.parse(savedCustomers) : []);
        setSamplesState(savedSamples ? JSON.parse(savedSamples) : []);
        setMasterProducts(savedMasterProducts ? JSON.parse(savedMasterProducts) : []);
        
        if (savedExhibitions) {
          try {
            const parsed: Exhibition[] = JSON.parse(savedExhibitions);
            setExhibitionsState(parsed.map(exh => ({ ...exh, eventSeries: Array.isArray(exh.eventSeries) ? exh.eventSeries : [] })));
          } catch (e) { setExhibitionsState([]); }
        }
        
        setExpensesState(savedExpenses ? JSON.parse(savedExpenses) : []);
        setFxRatesState(savedFxRates ? JSON.parse(savedFxRates) : []);
        
        if (savedTagOptions) {
          try {
            const parsed: TagOptions = JSON.parse(savedTagOptions);
            setTagOptionsState({
              ...DEFAULT_TAGS,
              ...parsed,
              sampleStatus: DEFAULT_TAGS.sampleStatus,
              interactionTypes: Array.isArray(parsed.interactionTypes) ? parsed.interactionTypes : DEFAULT_TAGS.interactionTypes,
              interactionEffects: Array.isArray(parsed.interactionEffects) ? parsed.interactionEffects : DEFAULT_TAGS.interactionEffects,
              feeStatus: Array.isArray(parsed.feeStatus) ? parsed.feeStatus : DEFAULT_TAGS.feeStatus,
              expenseCategory: Array.isArray(parsed.expenseCategory) ? parsed.expenseCategory : DEFAULT_TAGS.expenseCategory
            });
          } catch (e) { setTagOptionsState(DEFAULT_TAGS); }
        }
      }
      setDataLoaded(true);
    };

    loadAllData();
  }, [storageMode]);

  useEffect(() => {
    const uniqueTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));
    if (uniqueTags.length === 0) return;
    setExhibitionsState(prev => {
      let hasChanged = false;
      const updated = [...prev];
      uniqueTags.forEach(tagName => {
        const exists = updated.find(e => e.name === tagName);
        if (!exists) {
          updated.push({ id: `exh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: tagName, date: '', location: 'TBD', link: '#', eventSeries: [] });
          hasChanged = true;
        }
      });
      return hasChanged ? updated : prev;
    });
  }, [customers]);

  useEffect(() => {
    const usedSeries = Array.from(new Set(exhibitions.flatMap(e => e.eventSeries || [])));
    if (usedSeries.length === 0) return;
    setTagOptionsState(prev => {
      const existingSeries = new Set(prev.eventSeries);
      const newFoundSeries = usedSeries.filter(s => s && !existingSeries.has(s));
      if (newFoundSeries.length === 0) return prev;
      return { ...prev, eventSeries: [...prev.eventSeries, ...newFoundSeries] };
    });
  }, [exhibitions]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-warm', 'theme-dark-green');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'warm') root.classList.add('theme-warm');
    else if (theme === 'dark-green') root.classList.add('theme-dark-green');
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

  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('companyName', companyName); }, [companyName]);
  useEffect(() => { localStorage.setItem('userName', userName); }, [userName]);
  
  // Only save business data to localStorage in Local Mode
  // Team Mode data is stored in Supabase only
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('customers', JSON.stringify(customers)); 
  }, [customers, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('samples', JSON.stringify(samples)); 
  }, [samples, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('masterProducts', JSON.stringify(masterProducts)); 
  }, [masterProducts, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('exhibitions', JSON.stringify(exhibitions)); 
  }, [exhibitions, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('expenses', JSON.stringify(expenses)); 
  }, [expenses, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('fxRates', JSON.stringify(fxRates)); 
  }, [fxRates, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('isDemoData', String(isDemoData)); 
  }, [isDemoData, storageMode]);
  useEffect(() => { 
    if (storageMode === 'local') localStorage.setItem('tagOptions', JSON.stringify(tagOptions)); 
  }, [tagOptions, storageMode]);

  const toggleTheme = (newTheme: ThemeMode) => setTheme(newTheme);
  const setLanguage = (lang: Language) => setLanguageState(lang);
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const setCompanyName = (name: string) => setCompanyNameState(name);
  const setUserName = (name: string) => setUserNameState(name);
  const setCustomers = useCallback(async (val: Customer[] | ((prev: Customer[]) => Customer[])) => {
    const newValue = typeof val === 'function' ? val(customers || []) : val;
    // Ensure newValue is always an array
    const safeValue = Array.isArray(newValue) ? newValue : [];
    setCustomersState(safeValue);
    
    // Save based on storage mode
    if (storageMode === 'team' && dataLoaded) {
      // In team mode, individual saves are handled by API calls in components
      // This is just for local state update
    } else {
      localStorage.setItem('customers', JSON.stringify(safeValue));
    }
  }, [customers, storageMode, dataLoaded]);

  const setSamples = useCallback(async (val: Sample[] | ((prev: Sample[]) => Sample[])) => {
    const newValue = typeof val === 'function' ? val(samples || []) : val;
    // Ensure newValue is always an array
    const safeValue = Array.isArray(newValue) ? newValue : [];
    setSamplesState(safeValue);
    
    if (storageMode === 'team' && dataLoaded) {
      // Team mode saves via API
    } else {
      localStorage.setItem('samples', JSON.stringify(safeValue));
    }
  }, [samples, storageMode, dataLoaded]);
  const setExhibitions = (val: Exhibition[] | ((prev: Exhibition[]) => Exhibition[])) => setExhibitionsState(val);
  const setExpenses = (val: Expense[] | ((prev: Expense[]) => Expense[])) => setExpensesState(val);
  const setFxRates = (val: FXRate[] | ((prev: FXRate[]) => FXRate[])) => setFxRatesState(val);
  const setTagOptions = (val: TagOptions | ((prev: TagOptions) => TagOptions)) => setTagOptionsState(val);

  const refreshAllCustomerDates = useCallback(() => {
    setCustomersState(prev => prev.map(customer => {
      const computed = getComputedDatesForCustomer(customer.interactions);
      return {
        ...customer,
        lastContactDate: computed.lastContact || customer.lastContactDate,
        lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
        lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate
      };
    }));
  }, []);

  const updateGlobalFXRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const rates = data.rates;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      setFxRatesState(prev => {
        return prev.map(item => {
          const code = item.currency.toUpperCase();
          // The API gives USD to Target (1 USD = X Target). 
          // We need Target to USD (1 Target = ? USD).
          if (code === 'USD') return { ...item, rateToUSD: 1.0, lastUpdated: todayStr };
          if (rates[code]) {
            return { ...item, rateToUSD: 1 / rates[code], lastUpdated: todayStr };
          }
          return item;
        });
      });
    } catch (err) {
      console.error('Failed to update FX rates:', err);
      alert('Unable to sync rates at this moment. Please check network.');
    }
  };

  const refreshTagsFromSamples = (sampleList: Sample[], replace: boolean = false) => {
    setTagOptionsState(prev => {
      const newTags = replace ? {
          sampleStatus: [...DEFAULT_TAGS.sampleStatus], crystalType: [], productCategory: [], productForm: [],
          eventSeries: [...prev.eventSeries], interactionTypes: [...prev.interactionTypes], interactionEffects: [...prev.interactionEffects],
          feeStatus: [...DEFAULT_TAGS.feeStatus], expenseCategory: [...prev.expenseCategory]
      } : { 
          sampleStatus: [...DEFAULT_TAGS.sampleStatus], crystalType: [...prev.crystalType], productCategory: [...prev.productCategory],
          productForm: [...prev.productForm], eventSeries: [...prev.eventSeries], interactionTypes: [...prev.interactionTypes],
          interactionEffects: [...prev.interactionEffects], feeStatus: [...prev.feeStatus], expenseCategory: [...prev.expenseCategory]
      };
      const addUnique = (list: string[], item: string) => { if (item && !list.includes(item)) list.push(item); };
      sampleList.forEach(s => {
        if (s.crystalType) addUnique(newTags.crystalType, s.crystalType);
        if (s.productForm) addUnique(newTags.productForm, s.productForm);
        if (s.productCategory) s.productCategory.forEach(cat => addUnique(newTags.productCategory, cat));
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
    const nickname = sample.nickname ? ` (${sample.nickname})` : '';
    const generatedName = `${crystal} ${catStr} ${form} - ${orig}${proc}${nickname}`.trim();
    setMasterProducts(prev => {
      const exists = prev.find(p => p.productName === generatedName);
      if (exists) return prev;
      return [...prev, { id: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, productName: generatedName, crystalType: sample.crystalType!, productCategory: sample.productCategory || [], productForm: sample.productForm!, originalSize: sample.originalSize!, processedSize: sample.processedSize, nickname: sample.nickname }];
    });
    return generatedName;
  };

  const clearDatabase = () => {
    setCustomersState(MOCK_CUSTOMERS); setSamplesState(MOCK_SAMPLES); setMasterProducts(MOCK_MASTER_PRODUCTS); setExhibitionsState(MOCK_EXHIBITIONS); setExpensesState(MOCK_EXPENSES); setFxRatesState(MOCK_FXRATES);
    setIsDemoData(true); setTagOptionsState(DEFAULT_TAGS); setCompanyNameState('Zenith Advanced Materials'); setUserNameState('Demo User'); localStorage.clear();
  };

  const t = (key: keyof typeof translations['en']) => translations[language][key] || key;

  return (
    <AppContext.Provider value={{ 
      theme, toggleTheme, language, setLanguage, fontSize, setFontSize, companyName, setCompanyName, userName, setUserName, t,
      customers, setCustomers, samples, setSamples, exhibitions, setExhibitions, masterProducts, syncSampleToCatalog, expenses, setExpenses, fxRates, setFxRates,
      clearDatabase, isDemoData, setIsDemoData, tagOptions, setTagOptions, refreshTagsFromSamples, refreshAllCustomerDates, updateGlobalFXRates
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
