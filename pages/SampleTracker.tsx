
import React, { useState } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus, TestStatus } from '../types';
import { Card, Badge, Button, Modal } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, Filter, MoreHorizontal, GripVertical, Trash2, ArrowLeft, ArrowRight, CalendarDays, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const navigate = useNavigate();
  const { t, setSamples, masterProducts, syncSampleToCatalog, tagOptions, setTagOptions } = useApp();
  
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTestFinished, setFilterTestFinished] = useState<string>('ongoing'); 
  
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
    status: tagOptions.sampleStatus[0] || 'Requested',
    sampleSKU: ''
  });

  // Helper to detect Chinese characters
  const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str);

  const filteredSamples = samples
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
      // 1. Primary: Customer Rank (Highest first: 1 -> 5)
      const custA = customers.find(c => c.id === a.customerId);
      const custB = customers.find(c => c.id === b.customerId);
      const rankA = custA?.rank ?? 5;
      const rankB = custB?.rank ?? 5;
      if (rankA !== rankB) return rankA - rankB;

      // 2. Secondary: Customer Name (Ensures Adjacency & Alphabetical: Eng first)
      const aIsZh = hasChinese(a.customerName);
      const bIsZh = hasChinese(b.customerName);
      if (a.customerName !== b.customerName) {
        if (!aIsZh && bIsZh) return -1;
        if (aIsZh && !bIsZh) return 1;
        return a.customerName.localeCompare(b.customerName, 'zh-Hans-CN');
      }

      // 3. Tertiary: Key Date (Soonest first) - within the same customer group
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  const getUrgencyColor = (dateStr: string) => {
    if (!dateStr || !isValid(new Date(dateStr))) return "bg-white dark:bg-slate-800";
    const diff = differenceInDays(new Date(), new Date(dateStr));
    
    if (diff < 7) return "bg-emerald-50/40 border-l-emerald-500 dark:bg-emerald-900/10";
    if (diff < 30) return "bg-amber-50/40 border-l-amber-500 dark:bg-amber-900/10";
    return "bg-red-50/40 border-l-red-500 dark:bg-red-900/10";
  };

  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr || !isValid(new Date(dateStr))) return <span className="text-slate-400">-</span>;
    const diff = differenceInDays(new Date(), new Date(dateStr));
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

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('sampleTracking')}</h2>
          <p className="text-slate-500">Real-time status monitor with strict aging protocol.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex dark:bg-slate-800">
             <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} onClick={() => setViewMode('list')} className="py-1 px-4">{t('list')}</Button>
             <Button variant={viewMode === 'board' ? 'primary' : 'ghost'} onClick={() => setViewMode('board')} className="py-1 px-4">{t('board')}</Button>
          </div>
          <Button className="flex items-center gap-2 shadow-md" onClick={() => setIsAddModalOpen(true)}><Plus size={18} /> {t('newSample')}</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50">
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900" placeholder={t('searchSample')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
               <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                  <option value="">{t('customer')}: All</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
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

      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <Card className="border-0 shadow-xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                     <th className="p-4">Customer</th>
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
                  {filteredSamples.map(s => {
                    const isTestFinished = s.testStatus === 'Finished' || s.testStatus === 'Terminated';
                    return (
                      <tr key={s.id} onClick={() => navigate(`/samples/${s.id}`)} className={`cursor-pointer hover:bg-slate-100/50 border-l-4 transition-colors ${getUrgencyColor(s.lastStatusDate)}`}>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{s.customerName}</td>
                        <td className="p-4">
                           <div className="font-bold text-blue-600 dark:text-blue-400">{s.sampleName}</div>
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
                  {filteredSamples.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No samples match your filters</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </Card>
        ) : (
          <div className="flex h-full gap-6 overflow-x-auto pb-4">
             {tagOptions.sampleStatus.map((status) => {
                const colSamples = filteredSamples.filter(s => s.status === status);
                return (
                  <div key={status} className="w-80 shrink-0 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col shadow-inner">
                     <div className="flex justify-between items-center mb-4 px-1">
                        <h4 className="font-extrabold uppercase text-xs text-slate-500 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           {t(status as any)} ({colSamples.length})
                        </h4>
                     </div>
                     <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {colSamples.map(s => (
                          <Card key={s.id} onClick={() => navigate(`/samples/${s.id}`)} className={`p-4 cursor-pointer hover:shadow-lg border-l-4 transition-all hover:-translate-y-1 ${getUrgencyColor(s.lastStatusDate)}`}>
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-slate-400">#{s.sampleIndex}</span>
                                {renderDaysSinceUpdate(s.lastStatusDate)}
                             </div>
                             <p className="font-bold text-slate-900 dark:text-white mb-0.5">{s.customerName}</p>
                             <p className="text-sm font-bold text-blue-600 truncate">{s.sampleName}</p>
                             
                             <div className="mt-2 flex gap-1.5 flex-wrap">
                               {getGradingBadge(s.isGraded)}
                               {getTestStatusBadge(s.testStatus)}
                             </div>

                             <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <span className="text-[10px] font-mono text-slate-500">{s.sampleSKU || 'N/A'}</span>
                                <span className="text-[10px] font-bold text-slate-700">{s.quantity}</span>
                             </div>
                          </Card>
                        ))}
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
