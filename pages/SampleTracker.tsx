import React, { useState, useMemo } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus, TestStatus } from '../types';
import { Card, Badge, Button, Modal, parseLocalDate } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, Filter, MoreHorizontal, GripVertical, Trash2, ArrowLeft, ArrowRight, CalendarDays, X, ChevronDown, ChevronRight, User, ListFilter, Maximize2, Minimize2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

// User requested fixed order: 从左往右等待中，样品制作中，样品已发出，客户初步测试，客户初步结果
const FIXED_BOARD_ORDER = ['等待中', '样品制作中', '样品已发出', '客户初步测试', '客户初步结果'];

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const navigate = useNavigate();
  const { t, setSamples, masterProducts, syncSampleToCatalog, tagOptions, setTagOptions } = useApp();
  
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTestFinished, setFilterTestFinished] = useState<string>('ongoing'); 
  
  // Expansion state for both list and board view
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // New Filters
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

  // Derived: Are all currently filtered groups expanded?
  const isAllExpanded = useMemo(() => {
    if (groupedSamplesList.length === 0) return false;
    return groupedSamplesList.every(g => expandedCustomers.has(g.customerId));
  }, [groupedSamplesList, expandedCustomers]);

  const toggleAllExpansion = () => {
    if (isAllExpanded) {
      setExpandedCustomers(new Set());
    } else {
      setExpandedCustomers(new Set(groupedSamplesList.map(g => g.customerId)));
    }
  };

  const toggleCustomerExpansion = (cid: string) => {
    const next = new Set(expandedCustomers);
    if (next.has(cid)) next.delete(cid);
    else next.add(cid);
    setExpandedCustomers(next);
  };

  const getUrgencyColor = (dateStr: string) => {
    if (!dateStr) return "bg-white dark:bg-slate-800";
    const targetDate = parseLocalDate(dateStr);
    if (!isValid(targetDate)) return "bg-white dark:bg-slate-800";
    const diff = differenceInDays(startOfDay(new Date()), startOfDay(targetDate));
    
    if (diff < 7) return "bg-emerald-50/40 border-l-emerald-500 dark:bg-emerald-900/10";
    if (diff < 30) return "bg-amber-50/40 border-l-amber-500 dark:bg-amber-900/10";
    return "bg-red-50/40 border-l-red-500 dark:bg-red-900/10";
  };

  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr) return <span className="text-slate-400">-</span>;
    const targetDate = parseLocalDate(dateStr);
    if (!isValid(targetDate)) return <span className="text-slate-400">-</span>;
    const diff = differenceInDays(startOfDay(new Date()), startOfDay(targetDate));
    let colorClass = diff < 7 ? "text-emerald-600" : diff < 30 ? "text-amber-500" : "text-red-500";
    return <span className={`font-bold ${colorClass}`}>{diff}d</span>;
  };

  const getTestStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'Finished': return <Badge color="green">{t('projectFinished')}</Badge>;
      case 'Terminated': return <Badge color="red">{t('projectTerminated')}</Badge>;
      default: return <Badge color="yellow">{t('projectOngoing')}</Badge>;
    }
  };

  const getGradingBadge = (status: GradingStatus | string | undefined) => {
    if (status === 'Graded') return <Badge color="green">{t('graded')}</Badge>;
    return <Badge color="gray">{t('ungraded')}</Badge>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterTestFinished('ongoing');
    setFilterCrystal('');
    setFilterForm('');
    setFilterCustomer('');
    setFilterGrading('');
    setExpandedCustomers(new Set());
  };

  const handleCreateSample = () => {
    if (!newSample.customerId) {
      alert("Please select a customer.");
      return;
    }

    const targetCustomer = customers.find(c => c.id === newSample.customerId);
    if (!targetCustomer) return;

    const existingForCustomer = samples.filter(s => s.customerId === newSample.customerId);
    const maxIndex = existingForCustomer.reduce((max, s) => Math.max(max, s.sampleIndex || 0), 0);
    const newIndex = maxIndex + 1;

    const catStr = newSample.productCategory.join(', ');
    const procPart = newSample.processedSize ? ` > ${newSample.processedSize}` : '';
    const generatedName = `${newSample.crystalType} ${catStr} ${newSample.productForm} - ${newSample.originalSize}${procPart}`;

    const newId = `s_${Date.now()}`;
    const now = format(new Date(), 'yyyy-MM-dd');

    const sampleRecord: Sample = {
      id: newId,
      customerId: newSample.customerId,
      customerName: targetCustomer.name,
      sampleIndex: newIndex,
      sampleSKU: newSample.sampleSKU,
      status: newSample.status,
      lastStatusDate: now,
      testStatus: 'Ongoing',
      crystalType: newSample.crystalType,
      productCategory: newSample.productCategory as ProductCategory[],
      productForm: newSample.productForm as ProductForm,
      originalSize: newSample.originalSize,
      processedSize: newSample.processedSize,
      quantity: newSample.quantity || '0',
      sampleName: generatedName,
      requestDate: now,
      productType: generatedName,
      specs: `${newSample.originalSize}${procPart}`,
      statusDetails: `【${now}】Sample record created manually.`
    };

    setSamples(prev => [...prev, sampleRecord]);
    syncSampleToCatalog(sampleRecord);
    setIsAddModalOpen(false);
    navigate(`/samples/${newId}`);
  };

  // Determine current board statuses (Fixed + any custom ones not in fixed list)
  const currentBoardOrder = useMemo(() => {
    const extraStatuses = tagOptions.sampleStatus.filter(s => !FIXED_BOARD_ORDER.includes(s));
    return [...FIXED_BOARD_ORDER, ...extraStatuses];
  }, [tagOptions.sampleStatus]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('sampleTracking')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('monitorSamples')}</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex dark:bg-slate-800">
             <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} onClick={() => setViewMode('list')} className="py-1 px-4">{t('list')}</Button>
             <Button variant={viewMode === 'board' ? 'primary' : 'ghost'} onClick={() => setViewMode('board')} className="py-1 px-4">{t('board')}</Button>
          </div>
          <Button className="flex items-center gap-2 shadow-md" onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> {t('newSample')}</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50 border-2">
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900" placeholder={t('searchSample')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
               <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                  <option value="">{t('customer')}: All</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               
               <div className="h-full w-px bg-slate-200 dark:bg-slate-700 mx-1" />
               
               {/* Global Collapse/Expand Toggle Button */}
               <button 
                onClick={toggleAllExpansion}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isAllExpanded 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
                }`}
               >
                 {isAllExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                 {isAllExpanded ? 'Collapse All' : 'Expand All'}
               </button>

               <Button variant="ghost" className="text-xs text-slate-500" onClick={resetFilters}>Reset</Button>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
               <option value="">Status: All</option>
               {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
            </select>
            
            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterTestFinished} onChange={e => setFilterTestFinished(e.target.value)}>
               <option value="all">{t('test')}: All</option>
               <option value="ongoing">{t('filterTestOngoing')}</option>
               <option value="finished">{t('filterTestFinished')}</option>
               <option value="terminated">{t('filterTestTerminated')}</option>
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterCrystal} onChange={e => setFilterCrystal(e.target.value)}>
               <option value="">{t('crystal')}: All</option>
               {tagOptions.crystalType.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterForm} onChange={e => setFilterForm(e.target.value)}>
               <option value="">{t('form')}: All</option>
               {tagOptions.productForm.map(f => <option key={f} value={f}>{t(f as any)}</option>)}
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterGrading} onChange={e => setFilterGrading(e.target.value)}>
               <option value="">{t('grading')}: All</option>
               <option value="Graded">{t('graded')}</option>
               <option value="Ungraded">{t('ungraded')}</option>
            </select>
         </div>
      </Card>

      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? (
          <Card className="h-full border-0 shadow-xl overflow-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold sticky top-0 z-10">
                  <tr>
                     <th className="p-4 w-64">Customer</th>
                     <th className="p-4">Generated Product Spec</th>
                     <th className="p-4">{t('grading')}</th>
                     <th className="p-4">{t('qtyAbbr')}</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Next Step</th>
                     <th className="p-4">Key Date</th>
                     <th className="p-4 text-center">Aging</th>
                     <th className="p-4">Test</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groupedSamplesList.map(group => {
                    const isExpanded = expandedCustomers.has(group.customerId);
                    return (
                      <React.Fragment key={group.customerId}>
                        {/* Customer Header Row */}
                        <tr 
                          onClick={() => toggleCustomerExpansion(group.customerId)}
                          className="bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-700"
                        >
                          <td colSpan={9} className="p-4">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base">
                                {group.customerName}
                              </span>
                              <Badge color="gray">{group.samples.length} Samples</Badge>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Sample Detail Rows */}
                        {isExpanded && group.samples.map(s => {
                          const isTestFinished = s.testStatus === 'Finished' || s.testStatus === 'Terminated';
                          return (
                            <tr 
                              key={s.id} 
                              onClick={() => navigate(`/samples/${s.id}`)} 
                              className={`cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-l-4 transition-colors ${getUrgencyColor(s.lastStatusDate)}`}
                            >
                              <td className="p-4 pl-12">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample #{s.sampleIndex}</div>
                              </td>
                              <td className="p-4">
                                 <div className="font-bold text-blue-600 dark:text-blue-400 text-sm xl:text-base">{s.sampleName}</div>
                                 <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.sampleSKU || 'NOSKU'}</div>
                              </td>
                              <td className="p-4">
                                {getGradingBadge(s.isGraded)}
                              </td>
                              <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{s.quantity}</td>
                              <td className="p-4"><Badge color="blue">{t(s.status as any)}</Badge></td>
                              <td className="p-4 max-w-[200px]">
                                 <div className="truncate text-xs text-slate-600 dark:text-slate-300 italic" title={s.upcomingPlan}>
                                   {isTestFinished ? <span className="text-slate-400">N/A</span> : (s.upcomingPlan || '-')}
                                 </div>
                              </td>
                              <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-400">
                                 {isTestFinished ? 'N/A' : (s.nextActionDate || '-')}
                              </td>
                              <td className="p-4 text-center">{renderDaysSinceUpdate(s.lastStatusDate)}</td>
                              <td className="p-4">
                                 {getTestStatusBadge(s.testStatus)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  
                  {groupedSamplesList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No samples match your filters</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </Card>
        ) : (
          <div className="flex h-full gap-6 overflow-x-auto pb-4 scrollbar-hide">
             {currentBoardOrder.map((status) => {
                const colSamples = filteredSamples.filter(s => s.status === status);
                
                // Group column samples by customer for board view
                const colGroups: { customerId: string, customerName: string, samples: Sample[] }[] = [];
                colSamples.forEach(s => {
                  let lastGroup = colGroups[colGroups.length - 1];
                  if (lastGroup && lastGroup.customerId === s.customerId) {
                    lastGroup.samples.push(s);
                  } else {
                    // Fix 'string' type used as a value here.
                    colGroups.push({ customerId: s.customerId, customerName: s.customerName, samples: [s] });
                  }
                });

                return (
                  <div key={status} className="flex-1 min-w-[320px] max-w-[480px] bg-slate-100 dark:bg-slate-900/50 rounded-3xl p-5 flex flex-col shadow-inner">
                     <div className="flex justify-between items-center mb-5 px-1">
                        <h4 className="font-extrabold uppercase text-sm xl:text-base text-slate-500 flex items-center gap-2 tracking-widest">
                           <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                           {t(status as any)} ({colSamples.length})
                        </h4>
                     </div>
                     <div className="space-y-5 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                        {colGroups.map(group => {
                          const isExpanded = expandedCustomers.has(group.customerId);
                          return (
                            <div key={`${status}-${group.customerId}`} className="space-y-3">
                               {/* Board Customer Header */}
                               <div 
                                 onClick={() => toggleCustomerExpansion(group.customerId)}
                                 className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-[0.99]"
                               >
                                 <div className="flex items-center gap-3 min-w-0">
                                    {isExpanded ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                                    <span className="font-black text-sm xl:text-base text-slate-900 dark:text-white uppercase truncate tracking-tight">{group.customerName}</span>
                                 </div>
                                 <Badge color="gray">{group.samples.length}</Badge>
                               </div>

                               {/* Indented Sample Cards */}
                               {isExpanded && (
                                 <div className="pl-4 space-y-3 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                                   {group.samples.map(s => (
                                     <Card 
                                       key={s.id} 
                                       onClick={() => navigate(`/samples/${s.id}`)} 
                                       className={`p-5 cursor-pointer hover:shadow-xl border-l-4 transition-all hover:-translate-y-1 ${getUrgencyColor(s.lastStatusDate)}`}
                                     >
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample #{s.sampleIndex}</span>
                                          {renderDaysSinceUpdate(s.lastStatusDate)}
                                        </div>
                                        <p className="text-base font-black text-blue-600 dark:text-blue-400 leading-snug mb-3 line-clamp-2 uppercase tracking-tight">{s.sampleName}</p>
                                        
                                        <div className="flex gap-1.5 flex-wrap">
                                          <div className="scale-90 origin-left">
                                            {getTestStatusBadge(s.testStatus)}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] uppercase">{s.sampleSKU || 'NO SKU'}</span>
                                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{s.quantity}</span>
                                        </div>
                                     </Card>
                                   ))}
                                 </div>
                               )}
                            </div>
                          );
                        })}
                        {colGroups.length === 0 && (
                           <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-30">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Empty</span>
                           </div>
                        )}
                     </div>
                  </div>
                );
             })}
          </div>
        )}
      </div>

      {/* Create Sample Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('createSample')}>
         <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('selectCustomer')} *</label>
                 <select 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.customerId}
                    onChange={(e) => setNewSample({...newSample, customerId: e.target.value})}
                 >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('crystal')}</label>
                 <select 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.crystalType}
                    onChange={(e) => setNewSample({...newSample, crystalType: e.target.value})}
                 >
                    {tagOptions.crystalType.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('form')}</label>
                 <select 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.productForm}
                    onChange={(e) => setNewSample({...newSample, productForm: e.target.value})}
                 >
                    {tagOptions.productForm.map(f => <option key={f} value={f}>{t(f as any)}</option>)}
                 </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('category')}</label>
                 <div className="flex flex-wrap gap-2 p-3 border-2 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    {tagOptions.productCategory.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => {
                          const updated = newSample.productCategory.includes(cat)
                            ? newSample.productCategory.filter(c => c !== cat)
                            : [...newSample.productCategory, cat];
                          setNewSample({...newSample, productCategory: updated});
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${newSample.productCategory.includes(cat) ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200'}`}
                      >
                        {t(cat as any)}
                      </button>
                    ))}
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('original')}</label>
                 <input 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.originalSize}
                    onChange={(e) => setNewSample({...newSample, originalSize: e.target.value})}
                    placeholder="e.g. 10um"
                 />
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('processed')}</label>
                 <input 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.processedSize}
                    onChange={(e) => setNewSample({...newSample, processedSize: e.target.value})}
                    placeholder="e.g. 5um"
                 />
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('quantity')}</label>
                 <input 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.quantity}
                    onChange={(e) => setNewSample({...newSample, quantity: e.target.value})}
                    placeholder="e.g. 500g"
                 />
              </div>

              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('sampleSku')}</label>
                 <input 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-sm"
                    value={newSample.sampleSKU}
                    onChange={(e) => setNewSample({...newSample, sampleSKU: e.target.value})}
                    placeholder="Internal SKU..."
                 />
              </div>

              <div className="col-span-1 md:col-span-2">
                 <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('currentStatus')}</label>
                 <select 
                    className="w-full border-2 rounded-xl p-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold"
                    value={newSample.status}
                    onChange={(e) => setNewSample({...newSample, status: e.target.value})}
                 >
                    {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                 </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
               <Button onClick={handleCreateSample} className="px-8 shadow-xl bg-blue-600">Create Sample</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default SampleTracker;
