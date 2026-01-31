
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, Button, Modal } from '../components/Common';
// Fix error: Add missing ArrowRight import from lucide-react
import { Search, Filter, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, ArrowRight, ExternalLink, X, ChevronDown, List, BarChart3, PieChart, Wallet, Calendar, Tag, User, Activity, RefreshCw, TrendingUp, LayoutDashboard, History, Layers, AlertCircle, Star, Plus, PencilLine, Trash2, Link as LinkIcon, Save } from 'lucide-react';
import { format, isValid, startOfMonth, parseISO } from 'date-fns';
import { translateDisplay } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, ReferenceLine } from 'recharts';
import { Expense } from '../types';

interface UnifiedTransaction {
  id: string;
  source: 'Sample' | 'Expense';
  category: string;
  detail: string;
  expInc: string;
  party: string;
  name: string;
  origDate: string;
  transDate: string;
  status: string;
  currency: string;
  balance: string;
  comment: string;
  link: string;
}

const FinanceTracker: React.FC = () => {
  const { t, samples, expenses, setExpenses, fxRates, language, updateGlobalFXRates, tagOptions } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

  // FX Display Config
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  // Filters
  const [filterExpInc, setFilterExpInc] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Unified Conversion Function
  const convertAmount = (val: string, fromCurr: string, toCurr: string) => {
    const amount = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    const rateFrom = fxRates.find(r => r.currency.toUpperCase() === fromCurr.toUpperCase())?.rateToUSD || 1.0;
    const rateTo = fxRates.find(r => r.currency.toUpperCase() === toCurr.toUpperCase())?.rateToUSD || 1.0;
    return (amount * rateFrom) / rateTo;
  };

  const unifiedData: UnifiedTransaction[] = useMemo(() => {
    const sampleFees: UnifiedTransaction[] = samples
      .filter(s => s.isPaid)
      .map(s => ({
        id: s.id, source: 'Sample', category: s.feeCategory || '', detail: s.nickname || '', expInc: s.feeType || '收入', party: s.customerName, name: s.sampleName || '', origDate: s.originationDate || '', transDate: s.transactionDate || '', status: s.feeStatus || '', currency: (s.currency || 'USD').toUpperCase(), balance: s.balance || '0', comment: s.feeComment || '', link: s.docLinks && s.docLinks.length > 0 ? s.docLinks[0].url : ''
      }));
    const expenseRecords: UnifiedTransaction[] = expenses.map(e => ({
      id: e.id, source: 'Expense', category: e.category, detail: e.detail, expInc: e.expInc || '支出', party: e.party, name: e.name, origDate: e.originationDate, transDate: e.transactionDate, status: e.status, currency: (e.currency || 'USD').toUpperCase(), balance: e.balance, comment: e.comment, link: e.link
    }));
    return [...sampleFees, ...expenseRecords].sort((a, b) => {
      const dateA = a.transDate || a.origDate || '0000-00-00';
      const dateB = b.transDate || b.origDate || '0000-00-00';
      return dateB.localeCompare(dateA);
    });
  }, [samples, expenses]);

  const uniqueOptions = useMemo(() => {
    const categories = new Set<string>();
    const statuses = new Set<string>();
    const parties = new Set<string>();
    const years = new Set<string>();
    
    unifiedData.forEach(d => { 
      if (d.category) categories.add(d.category); 
      if (d.status) statuses.add(d.status); 
      if (d.party) parties.add(d.party); 
      
      const date = d.transDate || d.origDate;
      if (date && date.length >= 4) {
        years.add(date.substring(0, 4));
      }
    });

    return { 
      categories: Array.from(categories).sort(), 
      statuses: Array.from(statuses).sort(), 
      parties: Array.from(parties).sort(),
      years: Array.from(years).sort((a, b) => b.localeCompare(a)) // Newest years first
    };
  }, [unifiedData]);

  const filteredData = useMemo(() => {
    return unifiedData.filter(d => {
      const searchStr = `${d.party} ${d.name} ${d.detail} ${d.category} ${d.comment}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesExpInc = filterExpInc === '' || d.expInc === filterExpInc;
      const matchesCategory = filterCategory === '' || d.category === filterCategory;
      const matchesCurrency = filterCurrency === '' || d.currency === filterCurrency;
      const matchesStatus = filterStatus === '' || d.status === filterStatus;
      const matchesParty = filterParty === '' || d.party === filterParty;
      
      const date = d.transDate || d.origDate || '';
      const matchesYear = filterYear === '' || date.startsWith(filterYear);

      return matchesSearch && matchesExpInc && matchesCategory && matchesCurrency && matchesStatus && matchesParty && matchesYear;
    });
  }, [unifiedData, searchTerm, filterExpInc, filterCategory, filterCurrency, filterStatus, filterParty, filterYear]);

  const summaryInDisplayCurrency = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    filteredData.forEach(d => {
      const converted = convertAmount(d.balance, d.currency, displayCurrency);
      if (d.expInc === '收入' || d.expInc === 'Income') incomeTotal += converted;
      else expenseTotal += converted;
    });
    return { income: incomeTotal, expense: expenseTotal, net: incomeTotal - expenseTotal };
  }, [filteredData, displayCurrency, fxRates]);

  // Dashboard Visual Logic
  const visualStats = useMemo(() => {
    const monthsMap: Record<string, { month: string, income: number, expense: number, chartExpense: number }> = {};
    const categoriesMap: Record<string, { name: string, income: number, expense: number, chartExpense: number }> = {};
    const statusesMap: Record<string, { name: string, income: number, expense: number, count: number }> = {};

    filteredData.forEach(d => {
      const val = convertAmount(d.balance, d.currency, displayCurrency);
      const isIncome = d.expInc === '收入' || d.expInc === 'Income';
      const date = d.transDate || d.origDate || 'Unknown';
      
      // 1. Time Trend
      const monthKey = date !== 'Unknown' ? format(startOfMonth(parseISO(date)), 'MMM yyyy') : 'Other';
      if (!monthsMap[monthKey]) monthsMap[monthKey] = { month: monthKey, income: 0, expense: 0, chartExpense: 0 };
      if (isIncome) monthsMap[monthKey].income += val;
      else {
        monthsMap[monthKey].expense += val;
        // chartExpense is negative for "below 0" visualization
        monthsMap[monthKey].chartExpense -= val;
      }

      // 2. Categories
      const cat = d.category || 'Other';
      if (!categoriesMap[cat]) categoriesMap[cat] = { name: cat, income: 0, expense: 0, chartExpense: 0 };
      if (isIncome) categoriesMap[cat].income += val;
      else {
        categoriesMap[cat].expense += val;
        categoriesMap[cat].chartExpense -= val; // For Diverging Bar Chart
      }

      // 3. Status
      const st = d.status || 'Pending';
      if (!statusesMap[st]) statusesMap[st] = { name: st, income: 0, expense: 0, count: 0 };
      if (isIncome) statusesMap[st].income += val;
      else statusesMap[st].expense += val;
      statusesMap[st].count++;
    });

    const trend = Object.values(monthsMap).sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
    });

    const topTransactions = [...filteredData].sort((a, b) => {
      const valA = convertAmount(a.balance, a.currency, displayCurrency);
      const valB = convertAmount(b.balance, b.currency, displayCurrency);
      return valB - valA;
    }).slice(0, 8);

    return { 
      trend, 
      categories: Object.values(categoriesMap), 
      statuses: Object.values(statusesMap),
      topTransactions 
    };
  }, [filteredData, displayCurrency, fxRates]);

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    await updateGlobalFXRates();
    setTimeout(() => setIsUpdatingRates(false), 500);
  };

  const handleOpenAddExpense = () => {
    setEditingExpense({
      category: '',
      detail: '',
      expInc: '支出',
      party: '',
      name: '',
      originationDate: format(new Date(), 'yyyy-MM-dd'),
      transactionDate: '',
      status: 'Pending',
      currency: 'USD',
      balance: '',
      comment: '',
      link: ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = expenses.find(ex => ex.id === id);
    if (target) {
      setEditingExpense({ ...target });
      setIsExpenseModalOpen(true);
    }
  };

  const handleDeleteExpense = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('confirmDeleteExpense'))) {
      setExpenses(prev => prev.filter(ex => ex.id !== id));
    }
  };

  const handleSaveExpense = () => {
    if (!editingExpense) return;
    if (!editingExpense.name || !editingExpense.balance) {
      alert("Name and Amount are required.");
      return;
    }

    if (editingExpense.id) {
      // Edit
      setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? { ...editingExpense } as Expense : ex));
    } else {
      // Create
      const newEx: Expense = {
        ...editingExpense,
        id: `exp_${Date.now()}`
      } as Expense;
      setExpenses(prev => [newEx, ...prev]);
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('finance')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('financeDesc')}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-1.5 rounded-xl flex items-center gap-3 shadow-sm">
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
               <DollarSign size={14} className="text-slate-400" />
               <select className="bg-transparent text-[10px] font-black uppercase outline-none" value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}>
                 {fxRates.map(f => <option key={f.id} value={f.currency}>{f.currency}</option>)}
               </select>
             </div>
             <button onClick={handleUpdateRates} className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all ${isUpdatingRates?'animate-pulse':''}`}>
                <RefreshCw size={12} className={isUpdatingRates?'animate-spin':''} /> {t('updateFxRates')}
             </button>
          </div>
          <div className="bg-slate-100 p-1.5 rounded-xl flex dark:bg-slate-800 shadow-inner">
             <button onClick={() => setViewMode('list')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('list')}</button>
             <button onClick={() => setViewMode('board')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('board')}</button>
          </div>
          <Button onClick={handleOpenAddExpense} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
             <Plus size={20} />
             <span className="font-black uppercase tracking-widest text-sm">{t('addExpense')}</span>
          </Button>
        </div>
      </div>

      <Card className="p-6 xl:p-8 border-2 rounded-2xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
             <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/50 flex flex-col gap-1">
                <span className={labelClass + " text-emerald-600"}>{t('totalIncome')} ({displayCurrency})</span>
                <span className="text-2xl xl:text-3xl font-black text-emerald-700 dark:text-emerald-400">+{summaryInDisplayCurrency.income.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
             </div>
             <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border-2 border-rose-100 dark:border-rose-800/50 flex flex-col gap-1">
                <span className={labelClass + " text-rose-600"}>{t('totalExpenses')} ({displayCurrency})</span>
                <span className="text-2xl xl:text-3xl font-black text-rose-700 dark:text-rose-400">-{summaryInDisplayCurrency.expense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
             </div>
             <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50 flex flex-col gap-1">
                <span className={labelClass + " text-blue-600"}>{t('totalBalance')} ({displayCurrency})</span>
                <span className={`text-2xl xl:text-3xl font-black ${summaryInDisplayCurrency.net >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>{summaryInDisplayCurrency.net.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
             </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm" placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-4 pb-4">
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Calendar size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                   <option value="">{language === 'zh' ? '年度: 全部' : 'YEAR: ALL'}</option>
                   {uniqueOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Filter size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none" value={filterExpInc} onChange={e => setFilterExpInc(e.target.value)}>
                   <option value="">{t('feeType')}: ALL</option>
                   <option value="收入">{t('income')}</option>
                   <option value="支出">{t('expense')}</option>
                </select>
             </div>
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100">
                <Tag size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                   <option value="">{t('feeCategory')}: ALL</option>
                   {uniqueOptions.categories.map(c => <option key={c} value={c}>{translateDisplay(c, language)}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100">
                <Activity size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="">{t('status')}: ALL</option>
                   {uniqueOptions.statuses.map(s => <option key={s} value={s}>{translateDisplay(s, language)}</option>)}
                </select>
             </div>
             <div className="ml-auto flex items-center gap-3">
               <span className="text-[10px] font-black uppercase text-slate-400 italic">口径参考: {fxRates.map(f => `${f.currency}=${f.rateToUSD.toFixed(3)}`).join(', ')}</span>
               <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-4">{t('results')}: {filteredData.length}</span>
             </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-hidden border-2 rounded-2xl border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                  <tr>
                    <th className="p-6">{t('feeType')}</th>
                    <th className="p-6">{t('party')}</th>
                    <th className="p-6">{t('nameLabel')}</th>
                    <th className="p-6">{t('balance')} (ORIG)</th>
                    <th className="p-6 text-blue-600">{displayCurrency} (CALC)</th>
                    <th className="p-6">{t('status')}</th>
                    <th className="p-6">{t('transactionDate')}</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredData.map((d, i) => {
                    const isIncome = d.expInc === '收入' || d.expInc === 'Income';
                    const displayValue = convertAmount(d.balance, d.currency, displayCurrency);
                    return (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group ${d.source === 'Sample' ? 'cursor-pointer' : ''}`} onClick={() => d.source === 'Sample' && navigate(`/samples/${d.id}`)}>
                        <td className="p-6">
                           <div className={`flex items-center gap-2 font-black uppercase text-xs ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                              {translateDisplay(d.expInc, language)}
                           </div>
                        </td>
                        <td className="p-6 font-black text-blue-600 dark:text-blue-400 uppercase text-sm truncate max-w-[150px]">{d.party}</td>
                        <td className="p-6 font-black text-slate-900 dark:text-white text-sm truncate max-w-[200px] uppercase">{d.name}</td>
                        <td className="p-6 text-xs text-slate-400 font-bold whitespace-nowrap">{d.balance} {d.currency}</td>
                        <td className={`p-6 font-black text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {displayValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="p-6"><Badge color="blue">{translateDisplay(d.status, language)}</Badge></td>
                        <td className="p-6 font-black text-slate-400 text-xs whitespace-nowrap">{d.transDate || d.origDate}</td>
                        <td className="p-6 text-right">
                           {d.source === 'Expense' ? (
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleEditExpense(d.id, e)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-90">
                                   <PencilLine size={16} />
                                </button>
                                <button onClick={(e) => handleDeleteExpense(d.id, e)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all active:scale-90">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                           ) : (
                             <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-all group-hover:translate-x-1 inline-block" />
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="space-y-10 animate-in fade-in duration-700">
                {/* 1. Trend Chart */}
                <Card className="p-8 border-2 rounded-[2rem] bg-slate-50/30 dark:bg-slate-900/10">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
                         <TrendingUp className="text-blue-600" /> {language === 'zh' ? '现金流趋势' : 'Cash Flow Trend'} ({displayCurrency})
                      </h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400">{t('income')}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400">{t('expense')}</span>
                         </div>
                      </div>
                   </div>
                   <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={visualStats.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                               <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                               </linearGradient>
                               <linearGradient id="colorExpense" x1="0" y1="1" x2="0" y2="0">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={(value) => Math.abs(value).toLocaleString()} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                               labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                               formatter={(val: number, name: string) => {
                                  const label = name === 'income' ? t('income') : t('expense');
                                  return [Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 }), label];
                               }}
                            />
                            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                            <Area type="monotone" dataKey="income" name="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="chartExpense" name="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                {/* 2 & 3. Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Category Distribution - Adjusted to Back-to-Back Diverging Bars */}
                   <Card className="p-8 border-2 rounded-[2rem]">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                         <Layers className="text-indigo-600" size={20} /> {t('feeCategory')} {language === 'zh' ? '分布' : 'Breakdown'}
                      </h3>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={visualStats.categories} layout="vertical" margin={{ left: 10, right: 30 }}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                               <XAxis type="number" hide />
                               <YAxis 
                                  dataKey="name" 
                                  type="category" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} 
                                  width={100} 
                                  tickFormatter={(v) => translateDisplay(v, language)} 
                               />
                               <Tooltip 
                                  cursor={{fill: '#f8fafc'}}
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 900 }}
                                  formatter={(val: number, name: string) => [Math.abs(val).toLocaleString(), name === 'income' ? t('income') : t('expense')]}
                               />
                               <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
                               {/* Negative values go left, positive go right. Using [0, 4, 4, 0] for expense to fix visual bug based on Recharts swap behavior for horizontal negative bars */}
                               <Bar dataKey="chartExpense" name="expense" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={12} />
                               <Bar dataKey="income" name="income" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </Card>

                   {/* Status Breakdown Cards */}
                   <Card className="p-8 border-2 rounded-[2rem]">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                         <Activity className="text-amber-500" size={20} /> {language === 'zh' ? '状态分布' : 'Status Distribution'}
                      </h3>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                         {visualStats.statuses.map((st, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <div className="flex items-center gap-4">
                                  <Badge color="blue">{translateDisplay(st.name, language)}</Badge>
                                  <span className="text-[10px] font-black text-slate-400 uppercase">{st.count} {language === 'zh' ? '条记录' : 'Transactions'}</span>
                               </div>
                               <div className="flex gap-6 text-right">
                                  {st.income > 0 && (
                                     <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{t('income')}</p>
                                        <p className="text-sm font-black text-emerald-600">+{st.income.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                     </div>
                                  )}
                                  {st.expense > 0 && (
                                     <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{t('expense')}</p>
                                        <p className="text-sm font-black text-rose-600">-{st.expense.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                     </div>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </Card>
                </div>

                {/* 4. Top Transactions */}
                <Card className="p-8 border-2 rounded-[2rem]">
                   <div className="flex items-center justify-between mb-8">
                      <div className="space-y-1">
                         <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <Star className="text-amber-400 fill-amber-400" size={24} /> {language === 'zh' ? '高额交易分析' : 'Top Transactions Analysis'}
                         </h3>
                         <p className="text-xs text-slate-500 font-bold max-w-2xl leading-relaxed italic">
                            {language === 'zh' ? '识别出筛选范围内的高影响记录，包括重大单笔支出和显著的回款收入。' : 'Identified high-impact records including major single expenses and significant incoming payments across your filtered selection.'}
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {visualStats.topTransactions.map((d, i) => {
                         const isIncome = d.expInc === '收入' || d.expInc === 'Income';
                         const val = convertAmount(d.balance, d.currency, displayCurrency);
                         return (
                            <div key={i} className="flex items-center gap-5 p-5 border-2 border-slate-50 dark:border-slate-800 rounded-2xl hover:border-blue-200 transition-all group">
                               <div className={`p-4 rounded-xl shadow-sm ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {isIncome ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                     <h4 className="font-black text-slate-900 dark:text-white uppercase truncate text-sm xl:text-base">{d.name}</h4>
                                     <span className={`text-base xl:text-lg font-black tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {val.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                     </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{d.party}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{d.transDate || d.origDate}</span>
                                     </div>
                                     <Badge color="gray">{translateDisplay(d.category, language)}</Badge>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                      {visualStats.topTransactions.length === 0 && (
                         <div className="col-span-2 py-20 text-center flex flex-col items-center opacity-30">
                            <AlertCircle size={48} className="mb-4 text-slate-400" />
                            <p className="font-black uppercase tracking-widest text-slate-500">Insufficient Data for Ranking</p>
                         </div>
                      )}
                   </div>
                </Card>
             </div>
          )}
        </div>
      </Card>

      {/* Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }} 
        title={editingExpense?.id ? t('editExpense') : t('addExpense')}
      >
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('nameLabel')} / {t('detail')} *</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all uppercase"
                    value={editingExpense?.name || ''}
                    onChange={e => setEditingExpense({...editingExpense, name: e.target.value})}
                    placeholder="e.g. Travel tickets"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('feeType')}</label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                     <span className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <ArrowDownRight size={16} /> {t('expense')}
                     </span>
                  </div>
               </div>
               
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('feeCategory')}</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all uppercase"
                    value={editingExpense?.category || ''}
                    onChange={e => setEditingExpense({...editingExpense, category: e.target.value})}
                    placeholder="e.g. TRAVEL / LOGISTICS"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('party')}</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all uppercase"
                    value={editingExpense?.party || ''}
                    onChange={e => setEditingExpense({...editingExpense, party: e.target.value})}
                    placeholder="e.g. Airline Co."
                  />
               </div>

               <div className="space-y-1.5">
                  <label className={labelClass}>{t('originationDate')}</label>
                  <input 
                    type="date"
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all"
                    value={editingExpense?.originationDate || ''}
                    onChange={e => setEditingExpense({...editingExpense, originationDate: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('transactionDate')}</label>
                  <input 
                    type="date"
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all"
                    value={editingExpense?.transactionDate || ''}
                    onChange={e => setEditingExpense({...editingExpense, transactionDate: e.target.value})}
                  />
               </div>

               <div className="space-y-1.5">
                  <label className={labelClass}>{t('balance')} *</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all"
                    value={editingExpense?.balance || ''}
                    onChange={e => setEditingExpense({...editingExpense, balance: e.target.value})}
                    placeholder="0.00"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className={labelClass}>{t('currency')} *</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all uppercase"
                    value={editingExpense?.currency || ''}
                    onChange={e => setEditingExpense({...editingExpense, currency: e.target.value.toUpperCase()})}
                    placeholder="USD"
                  />
               </div>
            </div>

            <div className="space-y-1.5 pt-2">
               <label className={labelClass}>{t('status')}</label>
               <select 
                 className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all"
                 value={editingExpense?.status || ''}
                 onChange={e => setEditingExpense({...editingExpense, status: e.target.value})}
               >
                 <option value="Paid">Paid / 已付</option>
                 <option value="Pending">Pending / 待付</option>
                 <option value="Canceled">Canceled / 取消</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className={labelClass}>{t('feeComment')}</label>
               <textarea 
                 className="w-full p-4 border-2 rounded-2xl font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all min-h-[80px]"
                 value={editingExpense?.comment || ''}
                 onChange={e => setEditingExpense({...editingExpense, comment: e.target.value})}
                 placeholder="Notes..."
               />
            </div>

            <div className="space-y-1.5">
               <label className={labelClass}>Link / URL</label>
               <div className="relative">
                  <LinkIcon className="absolute left-4 top-4 text-slate-400" size={18} />
                  <input 
                    className="w-full p-4 pl-12 border-2 rounded-2xl font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all"
                    value={editingExpense?.link || ''}
                    onChange={e => setEditingExpense({...editingExpense, link: e.target.value})}
                    placeholder="https://..."
                  />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
               <Button variant="secondary" onClick={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }}>{t('cancel')}</Button>
               <Button onClick={handleSaveExpense} className="bg-blue-600 px-12 shadow-lg shadow-blue-600/20 font-black uppercase text-sm tracking-widest">
                  <Save size={18} className="mr-2" /> {t('save')}
               </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default FinanceTracker;
