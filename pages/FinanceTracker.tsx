
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, Badge, Button } from '../components/Common';
import { Search, Filter, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, ExternalLink, X, ChevronDown, List, BarChart3, PieChart, Wallet, Calendar, Tag, User, Activity } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { translateDisplay } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';

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
  const { t, samples, expenses, language } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterExpInc, setFilterExpInc] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');

  const unifiedData: UnifiedTransaction[] = useMemo(() => {
    const sampleFees: UnifiedTransaction[] = samples
      .filter(s => s.isPaid)
      .map(s => ({
        id: s.id,
        source: 'Sample',
        category: s.feeCategory || '',
        detail: s.nickname || '',
        expInc: s.feeType || '收入',
        party: s.customerName,
        name: s.sampleName || '',
        origDate: s.originationDate || '',
        transDate: s.transactionDate || '',
        status: s.feeStatus || '',
        currency: s.currency || 'USD',
        balance: s.balance || '0',
        comment: s.feeComment || '',
        link: s.docLinks && s.docLinks.length > 0 ? s.docLinks[0].url : ''
      }));

    const expenseRecords: UnifiedTransaction[] = expenses.map(e => ({
      id: e.id,
      source: 'Expense',
      category: e.category,
      detail: e.detail,
      expInc: e.expInc || '支出',
      party: e.party,
      name: e.name,
      origDate: e.originationDate,
      transDate: e.transactionDate,
      status: e.status,
      currency: e.currency,
      balance: e.balance,
      comment: e.comment,
      link: e.link
    }));

    return [...sampleFees, ...expenseRecords].sort((a, b) => {
      const dateA = a.transDate || a.origDate || '0000-00-00';
      const dateB = b.transDate || b.origDate || '0000-00-00';
      return dateB.localeCompare(dateA);
    });
  }, [samples, expenses]);

  // Dynamically extract unique values for filters from the ACTUAL data pool
  const uniqueOptions = useMemo(() => {
    const categories = new Set<string>();
    const statuses = new Set<string>();
    const parties = new Set<string>();

    unifiedData.forEach(d => {
      if (d.category) categories.add(d.category);
      if (d.status) statuses.add(d.status);
      if (d.party) parties.add(d.party);
    });

    return {
      categories: Array.from(categories).sort(),
      statuses: Array.from(statuses).sort(),
      parties: Array.from(parties).sort()
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
      
      return matchesSearch && matchesExpInc && matchesCategory && matchesCurrency && matchesStatus && matchesParty;
    });
  }, [unifiedData, searchTerm, filterExpInc, filterCategory, filterCurrency, filterStatus, filterParty]);

  // Aggregate stats for Board view
  const stats = useMemo(() => {
    const currencyTotals: Record<string, { income: number; expense: number }> = {};
    
    filteredData.forEach(d => {
      const cur = d.currency || 'USD';
      if (!currencyTotals[cur]) currencyTotals[cur] = { income: 0, expense: 0 };
      
      const val = parseFloat(d.balance.replace(/[^0-9.]/g, '')) || 0;
      // Normalizing Exp/Inc check for calculation
      if (d.expInc === '收入' || d.expInc === 'Income') {
        currencyTotals[cur].income += val;
      } else {
        currencyTotals[cur].expense += val;
      }
    });

    return currencyTotals;
  }, [filteredData]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterExpInc('');
    setFilterCategory('');
    setFilterCurrency('');
    setFilterStatus('');
    setFilterParty('');
  };

  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";

  const handleRowClick = (d: UnifiedTransaction) => {
    if (d.source === 'Sample') {
      navigate(`/samples/${d.id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('finance')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('financeDesc')}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 p-1.5 rounded-xl flex dark:bg-slate-800 shadow-inner">
             <button onClick={() => setViewMode('list')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('list')}</button>
             <button onClick={() => setViewMode('board')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('board')}</button>
          </div>
        </div>
      </div>

      <Card className="p-6 xl:p-8 border-2 rounded-2xl">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
             {/* Exp / Inc Filter */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Filter size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300" value={filterExpInc} onChange={e => setFilterExpInc(e.target.value)}>
                   <option value="">{t('feeType')}: ALL</option>
                   <option value="收入">{t('income')}</option>
                   <option value="支出">{t('expense')}</option>
                </select>
             </div>

             {/* Category Filter - Dynamically sourced from table content */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Tag size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                   <option value="">{t('feeCategory')}: ALL</option>
                   {uniqueOptions.categories.map(c => <option key={c} value={c}>{translateDisplay(c, language)}</option>)}
                </select>
             </div>

             {/* Status Filter - Dynamically sourced */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Activity size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="">{t('status')}: ALL</option>
                   {uniqueOptions.statuses.map(s => <option key={s} value={s}>{translateDisplay(s, language)}</option>)}
                </select>
             </div>

             {/* Party Filter - Dynamically sourced */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <User size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300 max-w-[150px]" value={filterParty} onChange={e => setFilterParty(e.target.value)}>
                   <option value="">{t('party')}: ALL</option>
                   {uniqueOptions.parties.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </div>

             {/* Currency Filter */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <DollarSign size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300" value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
                   <option value="">{t('currency')}: ALL</option>
                   <option value="USD">USD</option>
                   <option value="CNY">CNY</option>
                   <option value="EUR">EUR</option>
                   <option value="JPY">JPY</option>
                </select>
             </div>

             { (searchTerm || filterExpInc || filterCategory || filterCurrency || filterStatus || filterParty) && (
               <button onClick={resetFilters} className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors ml-2">
                 <X size={16} /> {t('cancel')}
               </button>
             )}

             <div className="ml-auto">
               <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">{t('results')}: {filteredData.length}</span>
             </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-hidden border-2 rounded-2xl border-slate-100 dark:border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                  <tr>
                    <th className="p-6">{t('feeType')}</th>
                    <th className="p-6">{t('feeCategory')}</th>
                    <th className="p-6">{t('party')}</th>
                    <th className="p-6">{t('nameLabel')}</th>
                    <th className="p-6">{t('detail')}</th>
                    <th className="p-6">{t('balance')}</th>
                    <th className="p-6">{t('status')}</th>
                    <th className="p-6">{t('transactionDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredData.map((d, i) => {
                    const isIncome = d.expInc === '收入' || d.expInc === 'Income';
                    return (
                      <tr 
                        key={i} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group ${d.source === 'Sample' ? 'cursor-pointer' : ''}`}
                        onClick={() => handleRowClick(d)}
                      >
                        <td className="p-6">
                           <div className={`flex items-center gap-2 font-black uppercase text-xs ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                              {translateDisplay(d.expInc, language)}
                           </div>
                        </td>
                        <td className="p-6 font-black text-slate-700 dark:text-slate-200 text-sm uppercase">{translateDisplay(d.category, language)}</td>
                        <td className="p-6 font-black text-blue-600 dark:text-blue-400 uppercase text-sm truncate max-w-[150px]">{d.party}</td>
                        <td className="p-6 font-black text-slate-900 dark:text-white text-sm truncate max-w-[200px] uppercase">{d.name}</td>
                        <td className="p-6 italic text-slate-500 text-xs truncate max-w-[150px]">{d.detail}</td>
                        <td className={`p-6 font-black text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>{isIncome ? '+' : '-'}{d.balance} <span className="text-[10px] opacity-40">{d.currency}</span></td>
                        <td className="p-6"><Badge color="blue">{translateDisplay(d.status, language)}</Badge></td>
                        <td className="p-6 font-black text-slate-400 text-xs whitespace-nowrap">{d.transDate || d.origDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="p-32 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-40">No matching records found.</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Summary Cards */}
               {(Object.entries(stats) as [string, { income: number; expense: number }][]).map(([cur, data]) => (
                 <Card key={cur} className="p-8 border-2 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                       <h4 className="font-black text-2xl text-blue-600">{cur}</h4>
                       <Badge color="gray">Summary</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <span className={labelClass}>{t('totalIncome')}</span>
                          <p className="text-2xl font-black text-emerald-600">+{data.income.toLocaleString()}</p>
                       </div>
                       <div className="space-y-1">
                          <span className={labelClass}>{t('totalExpenses')}</span>
                          <p className="text-2xl font-black text-rose-600">-{data.expense.toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                       <span className={labelClass}>{t('totalBalance')}</span>
                       <p className={`text-4xl font-black mt-1 ${data.income - data.expense >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                          {(data.income - data.expense).toLocaleString()}
                       </p>
                    </div>
                 </Card>
               ))}
               
               {/* Quick Breakdown Card */}
               <Card className="p-8 border-2 bg-slate-50 dark:bg-slate-900/50 shadow-inner flex flex-col justify-center items-center text-center opacity-60">
                  <BarChart3 size={48} className="text-slate-300 mb-4" />
                  <p className="font-black uppercase tracking-widest text-slate-400 text-sm">Detailed Visuals<br/>Pending Full Data</p>
               </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FinanceTracker;
