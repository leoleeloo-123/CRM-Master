
import React, { useState } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus } from '../types';
import { Card, Badge, Button, Modal } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, Filter, MoreHorizontal, GripVertical, Trash2, ArrowLeft, ArrowRight, CalendarDays, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const navigate = useNavigate();
  const { t, setSamples, masterProducts, syncSampleToCatalog, tagOptions, setTagOptions } = useApp();
  
  // Requirement 1: Default to 'list' view
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Drag and Drop State
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [menuOpenColumn, setMenuOpenColumn] = useState<string | null>(null);
  
  // Filter States
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Requirement 2: Default to 'ongoing' (samples with isTestFinished: false)
  const [filterTestFinished, setFilterTestFinished] = useState<string>('ongoing'); 
  const [filterCrystalType, setFilterCrystalType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterForm, setFilterForm] = useState<string>('');

  // Sample State for Form
  const [currentSample, setCurrentSample] = useState<Partial<Sample>>({
    customerId: '',
    status: 'Requested',
    isTestFinished: false,
    quantity: '',
    lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
    productCategory: [],
    sampleIndex: 1,
    isGraded: 'Graded',
    crystalType: 'Single Crystal',
    productForm: 'Powder'
  });

  const filteredSamples = samples.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleSKU || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.originalSize || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.processedSize || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Requirement 2: Test Finished filtering logic
    let matchesTest = true;
    if (filterTestFinished === 'finished') matchesTest = s.isTestFinished === true;
    else if (filterTestFinished === 'ongoing') matchesTest = s.isTestFinished === false;

    const matchesCustomer = filterCustomer ? s.customerId === filterCustomer : true;
    const matchesStatus = filterStatus ? s.status === filterStatus : true;
    const matchesCrystal = filterCrystalType ? s.crystalType === filterCrystalType : true;
    const matchesCategory = filterCategory ? s.productCategory?.includes(filterCategory as ProductCategory) : true;
    const matchesForm = filterForm ? s.productForm === filterForm : true;

    return matchesSearch && matchesTest && matchesCustomer && matchesStatus && matchesCrystal && matchesCategory && matchesForm;
  });

  // Get Unique Customers for Filter
  const uniqueCustomerIds = Array.from(new Set(samples.map(s => s.customerId)));
  const customerFilterOptions = customers.filter(c => uniqueCustomerIds.includes(c.id));

  const getStatusStyle = (status: string, index: number) => {
    const s = status.toLowerCase();
    if (s.includes('request') || s.includes('申请')) 
       return { icon: <ClipboardList className="w-4 h-4 xl:w-5 xl:h-5" />, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
    if (s.includes('process') || s.includes('处理') || s.includes('production')) 
       return { icon: <FlaskConical className="w-4 h-4 xl:w-5 xl:h-5" />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' };
    if (s.includes('sent') || s.includes('寄出') || s.includes('transit')) 
       return { icon: <Truck className="w-4 h-4 xl:w-5 xl:h-5" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' };
    if (s.includes('feedback') || s.includes('反馈') || s.includes('done')) 
       return { icon: <CheckCircle2 className="w-4 h-4 xl:w-5 xl:h-5" />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' };
    
    return { icon: <ClipboardList className="w-4 h-4 xl:w-5 xl:h-5" />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' };
  };

  const handleOpenEdit = (sample: Sample) => {
     navigate(`/samples/${sample.id}`);
  };

  const handleOpenNew = () => {
    setCurrentSample({
      customerId: '',
      customerName: '',
      status: tagOptions.sampleStatus[0] || 'Requested',
      isTestFinished: false,
      quantity: '',
      lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
      productCategory: [],
      sampleIndex: 1,
      isGraded: 'Graded',
      crystalType: tagOptions.crystalType[0] || 'Single Crystal',
      productForm: tagOptions.productForm[0] || 'Powder',
      statusDetails: '',
      sampleName: ''
    });
    setIsAddModalOpen(true);
  };

  const handleProductSelect = (productName: string) => {
    const product = masterProducts.find(p => p.productName === productName);
    if (product) {
      setCurrentSample(prev => ({
        ...prev,
        sampleName: product.productName,
        crystalType: product.crystalType,
        productCategory: product.productCategory,
        productForm: product.productForm,
        originalSize: product.originalSize,
        processedSize: product.processedSize || ''
      }));
    }
  };

  const generateSampleName = (s: Partial<Sample>) => {
    const catStr = s.productCategory?.join(', ') || '';
    const crystal = s.crystalType || '';
    const form = s.productForm || '';
    const orig = s.originalSize || '';
    const proc = s.processedSize ? ` > ${s.processedSize}` : '';
    return `${crystal} ${catStr} ${form} - ${orig}${proc}`.trim().replace(/\s+/g, ' ');
  };

  const handleSpecChange = (field: keyof Sample, value: any) => {
    setCurrentSample(prev => {
        const next = { ...prev, [field]: value };
        if (field === 'productCategory' && typeof value === 'string') {
            next.productCategory = [value as ProductCategory];
        }
        const newName = generateSampleName(next);
        return { ...next, sampleName: newName };
    });
  };

  const saveSample = () => {
     if (!currentSample.customerId || !currentSample.sampleName) return;
     syncSampleToCatalog(currentSample);
     setSamples(prev => {
       const exists = prev.find(s => s.id === currentSample.id);
       if (exists) {
         return prev.map(s => s.id === currentSample.id ? { ...s, ...currentSample } as Sample : s);
       } else {
         const newId = `s_${Date.now()}`;
         return [...prev, { ...currentSample, id: newId } as Sample];
       }
     });
     setIsAddModalOpen(false);
  };

  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr || !isValid(parseISO(dateStr))) return <span className="text-slate-400">-</span>;
    const diff = differenceInDays(new Date(), parseISO(dateStr));
    let colorClass = diff <= 7 ? "text-emerald-600 font-bold" : diff <= 30 ? "text-amber-500 font-bold" : "text-red-500 font-bold";
    return (
      <div className={`flex flex-col items-center leading-tight ${colorClass}`}>
        <span className="text-lg">{diff}</span>
        <span className="text-[10px] uppercase font-normal text-slate-400">{t('daysAgo')}</span>
      </div>
    );
  };
  
  const renderOption = (value: string) => t(value as any);
  
  const getDisplaySampleName = (s: Sample) => {
    if (s.crystalType && s.productCategory?.length) {
      const catStr = s.productCategory.map(c => t(c as any)).join(', ');
      const crystal = t(s.crystalType as any);
      const form = t((s.productForm || '') as any);
      const orig = s.originalSize || '';
      const proc = s.processedSize ? ` > ${s.processedSize}` : '';
      return `${crystal} ${catStr} ${form} - ${orig}${proc}`.trim().replace(/\s+/g, ' ');
    }
    return s.sampleName;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === dropIndex) return;
    const newStatuses = [...tagOptions.sampleStatus];
    const [movedItem] = newStatuses.splice(draggedColumnIndex, 1);
    newStatuses.splice(dropIndex, 0, movedItem);
    setTagOptions(prev => ({ ...prev, sampleStatus: newStatuses }));
    setDraggedColumnIndex(null);
  };

  const moveColumn = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === tagOptions.sampleStatus.length - 1) return;
    const newStatuses = [...tagOptions.sampleStatus];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    [newStatuses[index], newStatuses[targetIndex]] = [newStatuses[targetIndex], newStatuses[index]];
    setTagOptions(prev => ({ ...prev, sampleStatus: newStatuses }));
    setMenuOpenColumn(null);
  };

  const deleteColumn = (status: string) => {
    if (confirm(`Delete column "${status}"?`)) {
      setTagOptions(prev => ({ ...prev, sampleStatus: prev.sampleStatus.filter(s => s !== status) }));
    }
    setMenuOpenColumn(null);
  };
  
  const resetFilters = () => {
      setFilterCustomer('');
      setFilterStatus('');
      setFilterTestFinished('ongoing');
      setFilterCrystalType('');
      setFilterCategory('');
      setFilterForm('');
      setSearchTerm('');
  };

  const hasActiveFilters = filterCustomer || filterStatus || filterTestFinished !== 'ongoing' || filterCrystalType || filterCategory || filterForm || searchTerm;

  return (
    <div className="h-[calc(100vh-2rem)] xl:h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white mb-1">{t('sampleTracking')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg">{t('monitorSamples')}</p>
        </div>
        <div className="flex gap-2">
          {/* Requirement: List on the left, Board on the right. Default to List. */}
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
             <button 
               onClick={() => setViewMode('list')}
               className={`px-3 py-1 xl:px-5 xl:py-2 text-sm xl:text-base font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('list')}
             </button>
             <button 
               onClick={() => setViewMode('board')}
               className={`px-3 py-1 xl:px-5 xl:py-2 text-sm xl:text-base font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('board')}
             </button>
          </div>
          <Button className="flex items-center gap-2" onClick={handleOpenNew}><Plus className="w-4 h-4 xl:w-5 xl:h-5" /> {t('newSample')}</Button>
        </div>
      </div>

      <Card className="p-4 xl:p-6 mb-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
         <div className="flex flex-col gap-4">
             <div className="relative w-full">
               <Search className="absolute left-3 top-2.5 xl:top-3.5 text-slate-400 w-4 h-4 xl:w-6 xl:h-6" />
               <input 
                 type="text" 
                 placeholder={t('searchSample')}
                 className="w-full pl-9 xl:pl-12 pr-4 py-2 xl:py-3 text-sm xl:text-lg border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="flex flex-wrap gap-2 items-center text-sm xl:text-base">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mr-2 font-medium shrink-0">
                  <Filter className="w-4 h-4 xl:w-5 xl:h-5" /> {t('filters')}:
                </div>
                
                <select 
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 xl:px-3 xl:py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 max-w-[150px]"
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                >
                  <option value="">{t('customer')}</option>
                  {customerFilterOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select 
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 xl:px-3 xl:py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 max-w-[150px]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">{t('status')}</option>
                  {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{renderOption(s)}</option>)}
                </select>

                <select 
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 xl:px-3 xl:py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                  value={filterTestFinished}
                  onChange={(e) => setFilterTestFinished(e.target.value)}
                >
                  <option value="all">{t('filterTestAll')}</option>
                  <option value="finished">{t('filterTestFinished')}</option>
                  <option value="ongoing">{t('filterTestOngoing')}</option>
                </select>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 hidden md:block"></div>

                <select 
                   className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                   value={filterCrystalType}
                   onChange={(e) => setFilterCrystalType(e.target.value)}
                >
                   <option value="">{t('crystal')}: All</option>
                   {tagOptions.crystalType.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                </select>

                {hasActiveFilters && (
                   <button onClick={resetFilters} className="ml-auto text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                       <X size={14} /> Clear All
                   </button>
                )}
             </div>
         </div>
      </Card>

      {viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto pb-4">
           <div className="flex gap-6 h-full min-w-[max-content] px-1">
             {tagOptions.sampleStatus.map((status, index) => {
               const colSamples = filteredSamples.filter(s => s.status === status);
               const style = getStatusStyle(status, index);
               const isMenuOpen = menuOpenColumn === status;

               return (
                 <div 
                    key={status} 
                    className="flex-1 w-[300px] xl:w-[400px] shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 xl:p-6 flex flex-col h-full border border-slate-200 dark:border-slate-800 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                 >
                   <div className={`flex items-center justify-between mb-4 p-2 rounded-lg cursor-grab active:cursor-grabbing group ${style.color}`}>
                     <div className="flex items-center gap-2">
                       <GripVertical className="w-4 h-4 opacity-50" />
                       {style.icon}
                       <span className="font-bold text-sm xl:text-lg uppercase">{renderOption(status)}</span>
                       <span className="ml-1 bg-white dark:bg-slate-800 bg-opacity-50 px-1.5 py-0.5 rounded-full text-xs xl:text-sm font-mono">{colSamples.length}</span>
                     </div>
                     <div className="relative">
                       <button onClick={() => setMenuOpenColumn(isMenuOpen ? null : status)} className="p-1 hover:bg-black/10 rounded">
                         <MoreHorizontal className="w-4 h-4" />
                       </button>
                       {isMenuOpen && (
                         <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg z-20 w-40 overflow-hidden py-1">
                            <button onClick={() => moveColumn(index, 'left')} disabled={index===0} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-30">
                              <ArrowLeft size={14} /> Move Left
                            </button>
                            <button onClick={() => moveColumn(index, 'right')} disabled={index===tagOptions.sampleStatus.length-1} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-30">
                              <ArrowRight size={14} /> Move Right
                            </button>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                            <button onClick={() => deleteColumn(status)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                              <Trash2 size={14} /> Delete
                            </button>
                         </div>
                       )}
                     </div>
                   </div>
                   
                   <div className="space-y-3 xl:space-y-5 overflow-y-auto flex-1 pr-2 min-h-[200px]">
                     {colSamples.map(sample => (
                       <Card key={sample.id} className="p-3 xl:p-5 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500" onClick={() => handleOpenEdit(sample)}>
                         <div className="flex justify-between items-start mb-1">
                           <span className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400">
                             {sample.sampleIndex ? `#${sample.sampleIndex}` : ''} {sample.sampleSKU ? `(${sample.sampleSKU})` : ''}
                           </span>
                           <span className="text-xs xl:text-sm text-slate-400 dark:text-slate-500">{sample.requestDate}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{sample.customerName}</h4>
                         <p className="text-sm xl:text-lg text-blue-600 dark:text-blue-400 font-bold mt-1">{getDisplaySampleName(sample)}</p>
                         <div className="mt-2 text-xs xl:text-base text-slate-600 dark:text-slate-300 line-clamp-2">
                           {sample.statusDetails}
                         </div>
                         <div className="mt-2 xl:mt-3 flex justify-between items-center">
                            <span className={`text-xs xl:text-sm px-2 py-0.5 rounded ${sample.isTestFinished ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                               {sample.isTestFinished ? t('filterTestFinished') : t('filterTestOngoing')}
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                               <CalendarDays size={12} className="text-slate-400"/>
                               {renderDaysSinceUpdate(sample.lastStatusDate)}
                            </div>
                         </div>
                       </Card>
                     ))}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {viewMode === 'list' && (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto">
             <table className="w-full text-left text-sm xl:text-base text-slate-700 dark:text-slate-300">
               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="p-4 xl:p-6 w-16">{t('idx')}</th>
                   <th className="p-4 xl:p-6 w-1/5">{t('customer')}</th>
                   <th className="p-4 xl:p-6 w-1/5">{t('sampleInfo')}</th>
                   <th className="p-4 xl:p-6 w-1/4">{t('specs')}</th>
                   <th className="p-4 xl:p-6 w-24">{t('qtyAbbr')}</th>
                   <th className="p-4 xl:p-6">{t('statusInfo')}</th>
                   <th className="p-4 xl:p-6 whitespace-nowrap text-center">{t('sinceUpdate')}</th>
                   <th className="p-4 xl:p-6">{t('test')}</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredSamples.map(s => (
                   <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group" onClick={() => handleOpenEdit(s)}>
                     <td className="p-4 xl:p-6 align-top font-mono font-bold text-slate-500">{s.sampleIndex}</td>
                     <td className="p-4 xl:p-6 align-top">
                        <div className="font-bold text-base xl:text-lg text-slate-800 dark:text-white">{s.customerName}</div>
                     </td>
                     <td className="p-4 xl:p-6 align-top">
                       <div className="font-medium text-blue-600 dark:text-blue-400 text-base xl:text-lg">{getDisplaySampleName(s)}</div>
                       <div className="text-xs xl:text-sm text-slate-500 mt-1">{s.sampleSKU ? `SKU: ${s.sampleSKU}` : ''}</div>
                     </td>
                     <td className="p-4 xl:p-6 align-top text-xs xl:text-sm space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                            <Badge color="gray">{renderOption(s.productForm || '')}</Badge>
                            <Badge color="purple">{renderOption(s.crystalType || '')}</Badge>
                        </div>
                        <div className="space-y-1">
                             {s.originalSize && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 w-8">{t('origLabel')}:</span>
                                    <span className="font-medium">{s.originalSize}</span>
                                </div>
                             )}
                             {s.processedSize && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 w-8">{t('procLabel')}:</span>
                                    <span className="font-medium">{s.processedSize}</span>
                                </div>
                             )}
                        </div>
                     </td>
                     <td className="p-4 xl:p-6 align-top font-semibold text-slate-900 dark:text-white">{s.quantity}</td>
                     <td className="p-4 xl:p-6 align-top max-w-xs">
                       <Badge color={['Sent', 'Delivered', '已寄出', '已送达'].includes(s.status) ? 'blue' : ['Feedback Received', '已反馈'].includes(s.status) ? 'green' : 'yellow'}>
                         {renderOption(s.status)}
                       </Badge>
                       {/* Requirement: Removed group-hover:line-clamp-none to disable auto-expand */}
                       <div className="text-xs xl:text-sm mt-1 text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap transition-all">
                          {s.statusDetails}
                       </div>
                     </td>
                     <td className="p-4 xl:p-6 align-top text-center">{renderDaysSinceUpdate(s.lastStatusDate)}</td>
                     <td className="p-4 xl:p-6 align-top">
                       {s.isTestFinished ? <Badge color="green">Yes</Badge> : <Badge color="gray">No</Badge>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </Card>
      )}

      {/* New Sample Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('createSample')}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('customer')} *</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                value={currentSample.customerId}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setCurrentSample({...currentSample, customerId: e.target.value, customerName: customer?.name || ''});
                }}
              >
                <option value="">{t('selectCustomer')}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('index')} *</label>
               <input 
                 type="number"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={currentSample.sampleIndex || 1}
                 onChange={e => setCurrentSample({...currentSample, sampleIndex: parseInt(e.target.value)})}
               />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
             <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('productCatalog')} *</label>
                 <select 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                    value={masterProducts.find(p => p.productName === currentSample.sampleName) ? currentSample.sampleName : ''}
                    onChange={(e) => handleProductSelect(e.target.value)}
                 >
                   <option value="">{t('selectOrCustom')}</option>
                   {masterProducts.map(p => (
                     <option key={p.id} value={p.productName}>{p.productName}</option>
                   ))}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('generatedName')}</label>
                 <input 
                   type="text"
                   className="w-full border rounded-lg p-2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500"
                   value={currentSample.sampleName || ''}
                   readOnly
                 />
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('crystal')}</label>
                  <select 
                     className="w-full text-xs border rounded p-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                     value={currentSample.crystalType || ''}
                     onChange={(e) => handleSpecChange('crystalType', e.target.value)}
                  >
                    {tagOptions.crystalType.map(type => <option key={type} value={type}>{renderOption(type)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('category')}</label>
                  <select 
                     className="w-full text-xs border rounded p-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                     value={currentSample.productCategory?.[0] || ''}
                     onChange={(e) => handleSpecChange('productCategory', e.target.value)}
                  >
                    <option value="">-</option>
                    {tagOptions.productCategory.map(cat => <option key={cat} value={cat}>{renderOption(cat)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('form')}</label>
                  <select 
                     className="w-full text-xs border rounded p-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                     value={currentSample.productForm || ''}
                     onChange={(e) => handleSpecChange('productForm', e.target.value)}
                  >
                     {tagOptions.productForm.map(form => <option key={form} value={form}>{renderOption(form)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('original')}</label>
                  <input className="w-full text-xs border rounded p-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600" value={currentSample.originalSize || ''} onChange={(e) => handleSpecChange('originalSize', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t('processed')}</label>
                  <input className="w-full text-xs border rounded p-1.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600" value={currentSample.processedSize || ''} onChange={(e) => handleSpecChange('processedSize', e.target.value)} />
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={saveSample}>{t('saveRecord')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SampleTracker;
