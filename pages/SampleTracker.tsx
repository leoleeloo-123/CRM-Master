
import React, { useState, useMemo, useEffect } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus, TestStatus } from '../types';
import { Card, Badge, Button, Modal, parseLocalDate } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, Filter, MoreHorizontal, GripVertical, Trash2, ArrowLeft, ArrowRight, CalendarDays, X, ChevronDown, ChevronRight, User, ListFilter, Maximize2, Minimize2, ExternalLink, Star, Activity, Box, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

// Strictly mandated status order for the board
const FIXED_BOARD_ORDER = ['等待中', '样品制作中', '样品已发出', '客户初步测试', '客户初步结果'];

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const navigate = useNavigate();
  const { t, setSamples, masterProducts, syncSampleToCatalog, tagOptions, setTagOptions, language } = useApp();
  
  // State for View Mode
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTestFinished, setFilterTestFinished] = useState<string>('ongoing'); 
  
  // Expansion state - Initialize as empty Set to default to "Collapse All"
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Filters
  const [filterCrystal, setFilterCrystal] = useState<string>('');
  const [filterForm, setFilterForm] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterGrading, setFilterGrading] = useState<string>('');

  // Add Sample Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSample, setNewSample] = useState({
    customerId: '',
    crystalType: tagOptions.crystalType[0] || '',
    productCategory: [tagOptions.productCategory[0] || ''],
    productForm: tagOptions.productForm[0] || '',
    originalSize: '',
    processedSize: '',
    nickname: '',
    quantity: '',
    status: FIXED_BOARD_ORDER[0],
    sampleSKU: ''
  });

  // Helper to detect Chinese characters
  const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str);

  const filteredSamples = useMemo(() => {
    return samples
      .filter(s => {
        const matchesSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (s.sampleSKU || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesTest = true;
        if (filterTestFinished === 'finished') {
           matchesTest = s.testStatus === 'Finished';
        } else if (filterTestFinished === 'ongoing') {
           matchesTest = s.testStatus === 'Ongoing';
        } else if (filterTestFinished === 'terminated') {
           matchesTest = s.testStatus === 'Terminated';
        }

        const matchesStatus = filterStatus ? s.status === filterStatus : true;
        const matchesCrystal = filterCrystal ? s.crystalType === filterCrystal : true;
        const matchesForm = filterForm ? s.productForm === filterForm : true;
        const matchesCustomer = filterCustomer ? s.customerId === filterCustomer : true;
        const matchesGrading = filterGrading ? s.isGraded === filterGrading : true;

        return matchesSearch && matchesTest && matchesStatus && matchesCrystal && matchesForm && matchesCustomer && matchesGrading;
      })
      .sort((a, b) => {
        const custA = customers.find(c => c.id === a.customerId);
        const custB = customers.find(c => c.id === b.customerId);
        const rankA = custA?.rank ?? 5;
        const rankB = custB?.rank ?? 5;
        if (rankA !== rankB) return rankA - rankB;

        const aIsZh = hasChinese(a.customerName);
        const bIsZh = hasChinese(b.customerName);
        if (a.customerName !== b.customerName) {
          if (!aIsZh && bIsZh) return -1;
          if (aIsZh && !bIsZh) return 1;
          return a.customerName.localeCompare(b.customerName, 'zh-Hans-CN');
        }

        const dateA = a.nextActionDate || '9999-12-31';
        const dateB = b.nextActionDate || '9999-12-31';
        return dateA.localeCompare(dateB);
      });
  }, [samples, searchTerm, filterStatus, filterTestFinished, filterCrystal, filterForm, filterCustomer, filterGrading, customers]);

  // Grouped samples for the List View
  const groupedSamplesList = useMemo(() => {
    const groups: { customerId: string, customerName: string, samples: Sample[] }[] = [];
    filteredSamples.forEach(s => {
      let lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.customerId === s.customerId) {
        lastGroup.samples.push(s);
      } else {
        groups.push({ customerId: s.customerId, customerName: s.customerName, samples: [s] });
      }
    });
    return groups;
  }, [filteredSamples]);

  // Expansion logic
  const isAllExpanded = useMemo(() => {
    if (groupedSamplesList.length === 0) return false;
    return groupedSamplesList.every(g => expandedCustomers.has(g.customerId));
  }, [groupedSamplesList, expandedCustomers]);

  const toggleAllExpansion = () => {
    if (isAllExpanded) setExpandedCustomers(new Set());
    else setExpandedCustomers(new Set(groupedSamplesList.map(g => g.customerId)));
  };

  const toggleCustomerExpansion = (cid: string) => {
    const next = new Set(expandedCustomers);
    if (next.has(cid)) next.delete(cid);
    else next.add(cid);
    setExpandedCustomers(next);
  };

  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr) return <span className="text-slate-400">-</span>;
    const targetDate = parseLocalDate(dateStr);
    if (!isValid(targetDate)) return <span className="text-slate-400">-</span>;
    const diff = Math.abs(differenceInDays(startOfDay(new Date()), startOfDay(targetDate)));
    let colorClass = diff < 7 ? "text-emerald-600" : diff < 30 ? "text-amber-500" : "text-red-500";
    return <span className={`font-black ${colorClass}`}>{diff}d</span>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterTestFinished('ongoing');
    setFilterCrystal('');
    setFilterForm('');
    setFilterCustomer('');
    setFilterGrading('');
    // Stay collapsed on filter reset
    setExpandedCustomers(new Set());
  };

  const handleCreateSample = () => {
    if (!newSample.customerId) { alert("Please select a customer."); return; }
    const targetCustomer = customers.find(c => c.id === newSample.customerId);
    if (!targetCustomer) return;
    const existingForCustomer = samples.filter(s => s.customerId === newSample.customerId);
    const maxIndex = existingForCustomer.reduce((max, s) => Math.max(max, s.sampleIndex || 0), 0);
    const newIndex = maxIndex + 1;
    const catStr = newSample.productCategory.join(', ');
    const procPart = newSample.processedSize ? ` > ${newSample.processedSize}` : '';
    const nickname = newSample.nickname.trim();
    const generatedName = `${newSample.crystalType} ${catStr} ${newSample.productForm} - ${newSample.originalSize}${procPart}${nickname ? ` (${nickname})` : ''}`;
    const newId = `s_${Date.now()}`;
    const now = format(new Date(), 'yyyy-MM-dd');
    const sampleRecord: Sample = {
      id: newId, customerId: newSample.customerId, customerName: targetCustomer.name, sampleIndex: newIndex, sampleSKU: newSample.sampleSKU, status: newSample.status, lastStatusDate: now, testStatus: 'Ongoing', crystalType: newSample.crystalType, productCategory: newSample.productCategory as ProductCategory[], productForm: newSample.productForm as ProductForm, originalSize: newSample.originalSize, processedSize: newSample.processedSize, nickname: nickname, quantity: newSample.quantity || '0', sampleName: generatedName, requestDate: now, productType: generatedName, specs: `${newSample.originalSize}${procPart}`, statusDetails: `【${now}】Sample record created manually.`
    };
    setSamples(prev => [...prev, sampleRecord]);
    syncSampleToCatalog(sampleRecord);
    setIsAddModalOpen(false);
    navigate(`/samples/${newId}`);
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== '' || filterTestFinished !== 'ongoing' || filterCrystal !== '' || filterForm !== '' || filterCustomer !== '' || filterGrading !== '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('sampleTracking')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('monitorSamples')}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 p-1.5 rounded-xl flex dark:bg-slate-800 shadow-inner">
             <button onClick={() => setViewMode('list')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('list')}</button>
             <button onClick={() => setViewMode('board')} className={`px-8 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t('board')}</button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
             <Plus size={20} />
             <span className="font-black uppercase tracking-widest text-sm">{t('newSample')}</span>
          </Button>
        </div>
      </div>

      <Card className="p-6 xl:p-8 border-2 rounded-2xl">
        <div className="space-y-6">
          {/* Main Search - Exact Match with ExhibitionList */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm"
              placeholder={t('searchSample')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Bar - Unified Style & Alignment */}
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <User size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300 max-w-[150px]"
                  value={filterCustomer}
                  onChange={e => setFilterCustomer(e.target.value)}
                >
                  <option value="">{t('allCustomers')}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Activity size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">Status: All</option>
                  {FIXED_BOARD_ORDER.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <CheckCircle2 size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterTestFinished}
                  onChange={e => setFilterTestFinished(e.target.value)}
                >
                  <option value="all">{t('test')}: All</option>
                  <option value="ongoing">{t('filterTestOngoing')}</option>
                  <option value="finished">{t('filterTestFinished')}</option>
                  <option value="terminated">{t('filterTestTerminated')}</option>
                </select>
             </div>

             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Box size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterCrystal}
                  onChange={e => setFilterCrystal(e.target.value)}
                >
                  <option value="">{t('crystal')}: All</option>
                  {tagOptions.crystalType.map(c => <option key={c} value={c}>{t(c as any) || c}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <FlaskConical size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterForm}
                  onChange={e => setFilterForm(e.target.value)}
                >
                  <option value="">{t('form')}: All</option>
                  {tagOptions.productForm.map(f => <option key={f} value={f}>{t(f as any) || f}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Tag size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterGrading}
                  onChange={e => setFilterGrading(e.target.value)}
                >
                  <option value="">{t('grading')}: All</option>
                  <option value="Graded">{t('graded')}</option>
                  <option value="Ungraded">{t('ungraded')}</option>
                </select>
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

             {/* Global Expand Toggle - Matches ExhibitionList Style */}
             <button 
              onClick={toggleAllExpansion}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all ${
                isAllExpanded 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
             >
               {isAllExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
               {isAllExpanded ? t('collapseAll') : t('expandAll')}
             </button>

             {hasActiveFilters && (
               <button 
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors ml-2"
               >
                 <X size={16} /> {t('cancel')}
               </button>
             )}

             <div className="ml-auto">
               <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">
                 {t('results')}: {filteredSamples.length}
               </span>
             </div>
          </div>

          {/* List/Board View - Unified vertical spacing by removing pt-2 */}
          <div className="overflow-visible">
            {viewMode === 'list' ? (
              <div className="overflow-hidden border-2 rounded-2xl border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                    <tr>
                      <th className="p-6 pl-14 w-48">{t('customer')}</th>
                      <th className="p-6 w-72">{t('product')} Spec</th>
                      <th className="p-6 w-44">{t('docLinks')}</th>
                      <th className="p-6 text-center">{t('grading')}</th>
                      <th className="p-6 text-center w-20">{t('qtyAbbr')}</th>
                      <th className="p-6">Status</th>
                      <th className="p-6 text-center">⭐</th>
                      <th className="p-6">Next Step</th>
                      <th className="p-6 text-center">Aging</th>
                      <th className="p-6">Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {groupedSamplesList.map(group => {
                      const isExpanded = expandedCustomers.has(group.customerId);
                      return (
                        <React.Fragment key={group.customerId}>
                          {/* Group Header Row - Match ExhibitionList Header Style */}
                          <tr 
                            onClick={() => toggleCustomerExpansion(group.customerId)}
                            className="bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <td colSpan={10} className="p-5 border-y-2 border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] text-sm">
                                  {group.customerName}
                                </span>
                                <Badge color="gray">{group.samples.length} Samples</Badge>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Sample Rows */}
                          {isExpanded && group.samples.map(s => {
                            const isTestFinished = s.testStatus === 'Finished' || s.testStatus === 'Terminated';
                            return (
                              <tr 
                                key={s.id} 
                                onClick={() => navigate(`/samples/${s.id}`)} 
                                className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                              >
                                <td className="p-6 pl-14">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sample #{s.sampleIndex}</div>
                                </td>
                                <td className="p-6">
                                   <div className="font-black text-blue-600 dark:text-blue-400 text-base group-hover:underline transition-all leading-tight uppercase tracking-tight">
                                     {s.sampleName}
                                   </div>
                                   <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">{s.sampleSKU || 'NOSKU'}</div>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col gap-1.5 max-w-[160px]">
                                    {(s.docLinks || []).map((link, lIdx) => (
                                      <a 
                                        key={lIdx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] truncate flex items-center gap-1.5 font-bold uppercase tracking-tight"
                                        title={link.title}
                                      >
                                        <ExternalLink size={12} className="shrink-0" />
                                        {link.title}
                                      </a>
                                    ))}
                                    {(!s.docLinks || s.docLinks.length === 0) && <span className="text-slate-300 font-bold text-[10px] uppercase">-</span>}
                                  </div>
                                </td>
                                <td className="p-6 text-center">
                                  {s.isGraded === 'Graded' ? <Badge color="green">Graded</Badge> : <Badge color="gray">Un-G</Badge>}
                                </td>
                                <td className="p-6 text-center font-black text-slate-700 dark:text-slate-300 text-sm">{s.quantity}</td>
                                <td className="p-6">
                                  <Badge color="blue">{t(s.status as any)}</Badge>
                                </td>
                                <td className="p-6 text-center">
                                   {s.isStarredSample ? <Star size={16} className="fill-amber-400 text-amber-400 mx-auto" /> : <span className="text-slate-200">-</span>}
                                </td>
                                <td className="p-6 max-w-[180px]">
                                   <div className="truncate text-xs text-slate-600 dark:text-slate-300 font-bold italic" title={s.upcomingPlan}>
                                     {isTestFinished ? <span className="text-slate-400">N/A</span> : (s.upcomingPlan || '-')}
                                   </div>
                                   <div className="text-[9px] font-black text-slate-400 mt-1 uppercase">DDL: {s.nextActionDate || 'TBD'}</div>
                                </td>
                                <td className="p-6 text-center">{renderDaysSinceUpdate(s.lastStatusDate)}</td>
                                <td className="p-6">
                                   <Badge color={s.testStatus === 'Finished' ? 'green' : s.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                      <span className="text-[10px] font-black uppercase">{t(s.testStatus as any) || s.testStatus}</span>
                                   </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                    
                    {groupedSamplesList.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-24 text-center">
                          <FlaskConical className="w-16 h-16 mx-auto mb-6 opacity-10" />
                          <p className="text-sm xl:text-lg font-black uppercase tracking-[0.2em] text-slate-300">No Samples Match Filter</p>
                          <button onClick={resetFilters} className="mt-4 text-blue-500 font-bold uppercase text-xs tracking-widest hover:underline">Clear all filters</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[calc(100vh-420px)] min-h-[500px] gap-6 overflow-x-auto pb-4 scrollbar-hide">
                 {FIXED_BOARD_ORDER.map((status) => {
                    const colSamples = filteredSamples.filter(s => s.status === status);
                    const colGroups: { customerId: string, customerName: string, samples: Sample[] }[] = [];
                    colSamples.forEach(s => {
                      let lastGroup = colGroups[colGroups.length - 1];
                      if (lastGroup && lastGroup.customerId === s.customerId) {
                        lastGroup.samples.push(s);
                      } else {
                        colGroups.push({ customerId: s.customerId, customerName: s.customerName, samples: [s] });
                      }
                    });

                    return (
                      <div key={status} className="flex-1 min-w-[340px] max-w-[480px] bg-slate-100 dark:bg-slate-900/50 rounded-3xl p-5 flex flex-col shadow-inner border border-slate-200/50">
                         <div className="flex justify-between items-center mb-5 px-1">
                            <h4 className="font-black uppercase text-sm text-slate-500 flex items-center gap-3 tracking-[0.15em]">
                               <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                               {t(status as any)}
                               <span className="ml-1 opacity-50">({colSamples.length})</span>
                            </h4>
                         </div>
                         <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                            {colGroups.map(group => {
                              const isExpanded = expandedCustomers.has(group.customerId);
                              return (
                                <div key={`${status}-${group.customerId}`} className="space-y-2">
                                   <div 
                                     onClick={() => toggleCustomerExpansion(group.customerId)}
                                     className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-300 transition-all shadow-sm active:scale-[0.99]"
                                   >
                                     <div className="flex items-center gap-3 min-w-0">
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                                        <span className="font-black text-xs xl:text-sm text-slate-900 dark:text-white uppercase truncate tracking-tight">{group.customerName}</span>
                                     </div>
                                     <Badge color="gray">{group.samples.length}</Badge>
                                   </div>

                                   {isExpanded && (
                                     <div className="pl-3 space-y-3 border-l-2 border-slate-200 dark:border-slate-800 ml-2 py-1">
                                       {group.samples.map(s => (
                                         <Card 
                                           key={s.id} 
                                           onClick={() => navigate(`/samples/${s.id}`)} 
                                           className="p-5 cursor-pointer hover:shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-400 transition-all hover:-translate-y-1 bg-white dark:bg-slate-800"
                                         >
                                            <div className="flex justify-between items-start mb-3">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{s.sampleIndex}</span>
                                                {s.isStarredSample && <Star size={14} className="fill-amber-400 text-amber-400" />}
                                              </div>
                                              {renderDaysSinceUpdate(s.lastStatusDate)}
                                            </div>
                                            <p className="text-sm xl:text-base font-black text-blue-600 dark:text-blue-400 leading-tight mb-4 line-clamp-2 uppercase tracking-tight group-hover:underline">{s.sampleName}</p>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] uppercase font-bold">{s.sampleSKU || 'NOSKU'}</span>
                                              <div className="flex items-center gap-2">
                                                 <Badge color={s.testStatus === 'Finished' ? 'green' : s.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                                    <span className="text-[9px] font-black uppercase">{s.testStatus.charAt(0)}</span>
                                                 </Badge>
                                                 <span className="text-xs font-black text-slate-800 dark:text-white">{s.quantity}</span>
                                              </div>
                                            </div>
                                         </Card>
                                       ))}
                                     </div>
                                   )}
                                </div>
                              );
                            })}
                            {colGroups.length === 0 && (
                               <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-20">
                                  <FlaskConical size={32} className="mb-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Empty Stage</span>
                               </div>
                            )}
                         </div>
                      </div>
                    );
                 })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add Sample Modal - Styling refined to match overall aesthetic */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('createSample')}>
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('selectCustomer')} *</label>
                 <select 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black uppercase outline-none focus:border-blue-500"
                    value={newSample.customerId}
                    onChange={(e) => setNewSample({...newSample, customerId: e.target.value})}
                 >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('crystal')}</label>
                 <select 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.crystalType}
                    onChange={(e) => setNewSample({...newSample, crystalType: e.target.value})}
                 >
                    {tagOptions.crystalType.map(c => <option key={c} value={c}>{t(c as any) || c}</option>)}
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('form')}</label>
                 <select 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.productForm}
                    onChange={(e) => setNewSample({...newSample, productForm: e.target.value})}
                 >
                    {tagOptions.productForm.map(f => <option key={f} value={f}>{t(f as any) || f}</option>)}
                 </select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('category')}</label>
                 <div className="flex flex-wrap gap-2 p-4 border-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                    {tagOptions.productCategory.map(cat => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => {
                          const updated = newSample.productCategory.includes(cat)
                            ? newSample.productCategory.filter(c => c !== cat)
                            : [...newSample.productCategory, cat];
                          setNewSample({...newSample, productCategory: updated});
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newSample.productCategory.includes(cat) ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                      >
                        {t(cat as any) || cat}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('original')}</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.originalSize}
                    onChange={(e) => setNewSample({...newSample, originalSize: e.target.value})}
                    placeholder="e.g. 10um"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('processed')}</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.processedSize}
                    onChange={(e) => setNewSample({...newSample, processedSize: e.target.value})}
                    placeholder="e.g. 5um"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nickname / 昵称</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.nickname}
                    onChange={(e) => setNewSample({...newSample, nickname: e.target.value})}
                    placeholder="e.g. Agglomerated batch"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('quantity')}</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.quantity}
                    onChange={(e) => setNewSample({...newSample, quantity: e.target.value})}
                    placeholder="e.g. 500g"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('sampleSku')}</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-mono text-sm uppercase outline-none focus:border-blue-500"
                    value={newSample.sampleSKU}
                    onChange={(e) => setNewSample({...newSample, sampleSKU: e.target.value})}
                    placeholder="Internal SKU..."
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('currentStatus')}</label>
                 <select 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500"
                    value={newSample.status}
                    onChange={(e) => setNewSample({...newSample, status: e.target.value})}
                 >
                    {FIXED_BOARD_ORDER.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                 </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
               <Button onClick={handleCreateSample} className="px-10 shadow-xl bg-blue-600 font-black uppercase text-sm tracking-widest">Create Sample</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default SampleTracker;
