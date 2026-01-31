import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, Button } from '../components/Common';
import { Search, Filter, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, ExternalLink, X, ChevronDown, List, BarChart3, PieChart, Wallet, Calendar, Tag, User, Activity, RefreshCw, TrendingUp, LayoutDashboard, History, Layers, AlertCircle, Star } from 'lucide-react';
import { format, isValid, startOfMonth, parseISO } from 'date-fns';
import { translateDisplay } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';

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
  const { t, samples, expenses, fxRates, language, updateGlobalFXRates } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // FX Display Config
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  // Filters
  const [filterExpInc, setFilterExpInc] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');

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
    unifiedData.forEach(d => { 
      if (d.category) categories.add(d.category); 
      if (d.status) statuses.add(d.status); 
      if (d.party) parties.add(d.party); 
    });
    return { categories: Array.from(categories).sort(), statuses: Array.from(statuses).sort(), parties: Array.from(parties).sort() };
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
      return matchesSearch && matchesExpInc && matchesCategory && matchesCurrency && matchesStatus && matchesParty;
    });
  }, [unifiedData, searchTerm, filterExpInc, filterCategory, filterCurrency, filterStatus, filterParty]);

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
    const monthsMap: Record<string, { month: string, income: number, expense: number, net: number }> = {};
    const categoriesMap: Record<string, { name: string, income: number, expense: number }> = {};
    const statusesMap: Record<string, { name: string, income: number, expense: number, count: number }> = {};

    filteredData.forEach(d => {
      const val = convertAmount(d.balance, d.currency, displayCurrency);
      const isIncome = d.expInc === '收入' || d.expInc === 'Income';
      const date = d.transDate || d.origDate || 'Unknown';
      
      // 1. Time Trend
      const monthKey = date !== 'Unknown' ? format(startOfMonth(parseISO(date)), 'MMM yyyy') : 'Other';
      if (!monthsMap[monthKey]) monthsMap[monthKey] = { month: monthKey, income: 0, expense: 0, net: 0 };
      if (isIncome) monthsMap[monthKey].income += val;
      else monthsMap[monthKey].expense += val;
      monthsMap[monthKey].net = monthsMap[monthKey].income - monthsMap[monthKey].expense;

      // 2. Categories
      const cat = d.category || 'Other';
      if (!categoriesMap[cat]) categoriesMap[cat] = { name: cat, income: 0, expense: 0 };
      if (isIncome) categoriesMap[cat].income += val;
      else categoriesMap[cat].expense += val;

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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="space-y-10 animate-in fade-in duration-700">
                <Card className="p-8 border-2 rounded-[2rem] bg-slate-50/30 dark:bg-slate-900/10">
                   <div className="flex items-center justify-between mb-10">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
                         <TrendingUp className="text-blue-600" /> Cash Flow Trend ({displayCurrency})
                      </h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400">Income</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-slate-400">Expense</span>
                         </div>
                      </div>
                   </div>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={visualStats.trend}>
                            <defs>
                               <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                               </linearGradient>
                               <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                               formatter={(val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            />
                            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <Card className="p-8 border-2 rounded-[2rem]">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                         <Layers className="text-indigo-600" size={20} /> {t('feeCategory')} Breakdown
                      </h3>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={visualStats.categories} layout="vertical" margin={{ left: 40 }}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                               <XAxis type="number" hide />
                               <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} width={120} />
                               <Tooltip 
                                  cursor={{fill: '#f8fafc'}}
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '10px', fontWeight: 900 }}
                               />
                               <Bar dataKey="income" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                               <Bar dataKey="expense" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </Card>

                   <Card className="p-8 border-2 rounded-[2rem]">
                      <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                         <Activity className="text-amber-500" size={20} /> Status Distribution
                      </h3>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                         {visualStats.statuses.map((st, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <div className="flex items-center gap-4">
                                  <Badge color="blue">{translateDisplay(st.name, language)}</Badge>
                                  <span className="text-[10px] font-black text-slate-400 uppercase">{st.count} Transactions</span>
                               </div>
                               <div className="flex gap-6 text-right">
                                  {st.income > 0 && (
                                     <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Income</p>
                                        <p className="text-sm font-black text-emerald-600">+{st.income.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                     </div>
                                  )}
                                  {st.expense > 0 && (
                                     <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Expense</p>
                                        <p className="text-sm font-black text-rose-600">-{st.expense.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                                     </div>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </Card>
                </div>

                <Card className="p-8 border-2 rounded-[2rem]">
                   <div className="flex items-center justify-between mb-8">
                      <div className="space-y-1">
                         <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <Star className="text-amber-400 fill-amber-400" size={24} /> Top Transactions Analysis
                         </h3>
                         <p className="text-xs text-slate-500 font-bold max-w-2xl leading-relaxed italic">
                            Identified high-impact records including major single expenses and significant incoming payments across your filtered selection.
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
    </div>
  );
};

export default FinanceTracker;