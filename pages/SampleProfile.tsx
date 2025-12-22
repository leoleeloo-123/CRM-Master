
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus, TestStatus } from '../types';
import { Card, Button, Badge, StatusIcon, DaysCounter, Modal } from '../components/Common';
import { ArrowLeft, Box, Save, X, Edit, Plus, Trash2, CalendarDays, ExternalLink, Activity, Target, PencilLine, Ruler, Layers } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';

const SampleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, customers, setSamples, t, tagOptions, masterProducts, syncSampleToCatalog } = useApp();

  const sample = samples.find(s => s.id === id);
  const customer = customers.find(c => c.id === sample?.customerId);

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editSample, setEditSample] = useState<Partial<Sample>>({});
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  
  const [editAppText, setEditAppText] = useState('');
  const [editTrackingText, setEditTrackingText] = useState('');
  const [editQuantityText, setEditQuantityText] = useState('');

  const [historyItems, setHistoryItems] = useState<{id: string, date: string, text: string}[]>([]);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [newHistoryText, setNewHistoryText] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (sample) {
      setEditSample(sample);
      setEditAppText(sample.application || '');
      setEditTrackingText(sample.trackingNumber || '');
      setEditQuantityText(sample.quantity || '');
      parseHistory(sample.statusDetails);
    }
  }, [sample]);

  const parseHistory = (detailsStr?: string) => {
    if (!detailsStr) {
      setHistoryItems([]);
      return;
    }
    const parts = detailsStr.split('|||').map(s => s.trim()).filter(s => s);
    const items = parts.map((part, idx) => {
      const match = part.match(/【(.*?)】(.*)/);
      return {
        id: `hist_${idx}`,
        date: match ? match[1] : format(new Date(), 'yyyy-MM-dd'),
        text: match ? match[2].trim() : part
      };
    });
    setHistoryItems(items);
  };

  const serializeHistory = (items: typeof historyItems): string => {
    return items.map(item => `【${item.date}】${item.text}`).join(' ||| ');
  };

  const saveSampleUpdate = (fields: Partial<Sample>) => {
    if (!sample) return;
    setSamples(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  const handleSaveSpecs = () => {
    if (!sample || !editSample) return;
    const updatedSample = { ...sample, ...editSample } as Sample;
    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    syncSampleToCatalog(updatedSample);
    setIsEditingSpecs(false);
  };

  const handleSaveStatus = () => {
    if (!sample || !editSample) return;
    const updatedSample = { 
      ...sample, 
      status: editSample.status || sample.status,
      lastStatusDate: format(new Date(), 'yyyy-MM-dd')
    } as Sample;
    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    setIsEditingStatus(false);
  };

  const handleSaveTest = () => {
    if (!sample || !editSample) return;
    const updatedSample = { 
      ...sample, 
      testStatus: editSample.testStatus || sample.testStatus,
      lastStatusDate: format(new Date(), 'yyyy-MM-dd')
    } as Sample;
    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    setIsEditingTest(false);
  };

  const handleSaveApplication = () => {
    saveSampleUpdate({ application: editAppText });
    setIsEditingApp(false);
  };

  const handleSaveTracking = () => {
    saveSampleUpdate({ trackingNumber: editTrackingText });
    setIsEditingTracking(false);
  };

  const handleSaveQuantity = () => {
    saveSampleUpdate({ quantity: editQuantityText });
    setIsEditingQuantity(false);
  };

  const handleSaveHistoryItem = (item: {id: string, date: string, text: string}) => {
    const updatedHistory = historyItems.map(i => i.id === item.id ? item : i);
    setHistoryItems(updatedHistory);
    const serialized = serializeHistory(updatedHistory);
    setSamples(prev => prev.map(s => s.id === id ? { ...s, statusDetails: serialized, lastStatusDate: item.date } : s));
    setEditingHistoryId(null);
  };

  const handleAddHistory = () => {
    if (!newHistoryText) return;
    const newItem = {
      id: `new_${Date.now()}`,
      date: newHistoryDate || format(new Date(), 'yyyy-MM-dd'),
      text: newHistoryText
    };
    const updatedHistory = [newItem, ...historyItems];
    setHistoryItems(updatedHistory);
    const serialized = serializeHistory(updatedHistory);
    setSamples(prev => prev.map(s => s.id === id ? { ...s, statusDetails: serialized, lastStatusDate: newItem.date } : s));
    setIsAddingHistory(false);
    setNewHistoryText('');
    setNewHistoryDate('');
  };

  const handleDeleteHistory = (itemId: string) => {
    if (confirm('Delete this history record?')) {
      const updatedHistory = historyItems.filter(i => i.id !== itemId);
      setHistoryItems(updatedHistory);
      const serialized = serializeHistory(updatedHistory);
      setSamples(prev => prev.map(s => s.id === id ? { ...s, statusDetails: serialized } : s));
    }
  };

  if (!sample) return <div className="p-8 text-center font-black uppercase text-slate-400">Sample not found.</div>;

  const renderOption = (val: string) => t(val as any);

  const getTestBadge = (status: TestStatus) => {
    switch (status) {
      case 'Terminated':
        return <Badge color="red">{t('projectTerminated')}</Badge>;
      case 'Finished':
        return <Badge color="green">{t('filterTestFinished')}</Badge>;
      default:
        return <Badge color="yellow">{t('filterTestOngoing')}</Badge>;
    }
  };

  const getGradingBadge = (status: GradingStatus | string | undefined) => {
    if (status === 'Graded') return <Badge color="green">{t('graded')}</Badge>;
    return <Badge color="gray">{t('ungraded')}</Badge>;
  };

  return (
    <div className="space-y-8 xl:space-y-12 animate-in fade-in duration-500 pb-20">
       <div className="flex items-center gap-6">
         <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{sample.sampleName}</h1>
              <Badge color="blue">{sample.sampleSKU || 'No SKU'}</Badge>
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] xl:text-xs tracking-widest mt-3">
               Customer: <span className="text-blue-600 cursor-pointer hover:underline transition-all" onClick={() => navigate(`/customers/${sample.customerId}`)}>{sample.customerName}</span>
            </p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-8">
          <Card className={`p-5 xl:p-8 border-l-4 border-l-blue-600 flex flex-col justify-center relative shadow-sm transition-all ${isEditingStatus ? 'ring-4 ring-blue-500/20 border-blue-200' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest leading-none">{t('currentStatus')}</span>
               {!isEditingStatus ? (
                 <button onClick={() => setIsEditingStatus(true)} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-3 h-3 xl:w-4 xl:h-4" /></button>
               ) : (
                 <div className="flex gap-2.5">
                    <button onClick={handleSaveStatus} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                    <button onClick={() => setIsEditingStatus(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                 </div>
               )}
             </div>
             {isEditingStatus ? (
                <select className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm xl:text-base font-bold dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.status} onChange={e => setEditSample({...editSample, status: e.target.value as SampleStatus})}>
                   {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{renderOption(s)}</option>)}
                </select>
             ) : (
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{renderOption(sample.status)}</span>
                </div>
             )}
          </Card>

          <DaysCounter date={sample.lastStatusDate} label={t('daysSinceUpdate')} type="elapsed" />

          <Card className={`p-5 xl:p-8 flex flex-col justify-center relative shadow-sm transition-all ${isEditingTest ? 'ring-4 ring-blue-500/20 border-blue-200' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest leading-none">{t('testFinished')}</span>
               {!isEditingTest ? (
                 <button onClick={() => setIsEditingTest(true)} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-3 h-3 xl:w-4 xl:h-4" /></button>
               ) : (
                 <div className="flex gap-2.5">
                    <button onClick={handleSaveTest} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                    <button onClick={() => setIsEditingTest(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                 </div>
               )}
             </div>
             <div className="flex h-10 items-center">
              {isEditingTest ? (
                <select 
                  className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm xl:text-base font-bold dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" 
                  value={editSample.testStatus || 'Ongoing'} 
                  onChange={e => setEditSample({...editSample, testStatus: e.target.value as TestStatus})}
                >
                    <option value="Ongoing">{t('filterTestOngoing')}</option>
                    <option value="Finished">{t('filterTestFinished')}</option>
                    <option value="Terminated">{t('projectTerminated')}</option>
                </select>
              ) : (
                <div className="text-[1.1em]">{getTestBadge(sample.testStatus || 'Ongoing')}</div>
              )}
             </div>
          </Card>

          <Card className={`p-5 xl:p-8 flex flex-col justify-center relative shadow-sm transition-all ${isEditingTracking ? 'ring-4 ring-blue-500/20 border-blue-200' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest leading-none">{t('tracking')}</span>
               {!isEditingTracking ? (
                 <button onClick={() => setIsEditingTracking(true)} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-3 h-3 xl:w-4 xl:h-4" /></button>
               ) : (
                 <div className="flex gap-2.5">
                    <button onClick={handleSaveTracking} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                    <button onClick={() => setIsEditingTracking(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                 </div>
               )}
             </div>
             {isEditingTracking ? (
               <input 
                 className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm xl:text-base font-mono font-bold dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-blue-500 transition-all dark:text-white" 
                 value={editTrackingText} 
                 onChange={e => setEditTrackingText(e.target.value)}
                 autoFocus
               />
             ) : (
               <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-mono text-lg xl:text-xl font-black truncate leading-none">
                  <ExternalLink className="w-4 h-4 xl:w-5 xl:h-5" /> <span>{sample.trackingNumber || '-'}</span>
               </div>
             )}
          </Card>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          <div className="space-y-8">
             <Card className="p-6 xl:p-10 shadow-sm">
                <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-black text-base xl:text-lg flex items-center gap-3 uppercase tracking-wider"><Box className="w-5 h-5 xl:w-6 xl:h-6 text-blue-600" /> {t('specs')}</h3>
                   {!isEditingSpecs ? (
                     <button onClick={() => setIsEditingSpecs(true)} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                   ) : (
                     <div className="flex gap-3">
                       <button onClick={handleSaveSpecs} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                       <button onClick={() => setIsEditingSpecs(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                     </div>
                   )}
                </div>
                <div className="space-y-6">
                   {isEditingSpecs ? (
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('crystal')}</label>
                          <select className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.crystalType} onChange={e => setEditSample({...editSample, crystalType: e.target.value as any})}>
                            {tagOptions.crystalType.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('form')}</label>
                          <select className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.productForm} onChange={e => setEditSample({...editSample, productForm: e.target.value as any})}>
                            {tagOptions.productForm.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('grading')}</label>
                          <select className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.isGraded} onChange={e => setEditSample({...editSample, isGraded: e.target.value as any})}>
                            <option value="Graded">{t('graded')}</option>
                            <option value="Ungraded">{t('ungraded')}</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                             <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('origLabel')}</label>
                             <input className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} />
                           </div>
                           <div className="space-y-1.5">
                             <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('procLabel')}</label>
                             <input className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} />
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-5">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('crystal')}</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm xl:text-base">{renderOption(sample.crystalType || '-')}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('form')}</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm xl:text-base">{renderOption(sample.productForm || '-')}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('grading')}</span>
                          <span>{getGradingBadge(sample.isGraded)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('original')}</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm xl:text-base">{sample.originalSize || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('processed')}</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm xl:text-base">{sample.processedSize || '-'}</span>
                        </div>
                     </div>
                   )}
                </div>
             </Card>

             <Card className={`p-6 xl:p-10 relative shadow-sm transition-all ${isEditingQuantity ? 'ring-4 ring-indigo-500/20 border-indigo-200' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-base xl:text-lg flex items-center gap-3 uppercase tracking-wider"><Ruler className="w-5 h-5 xl:w-6 xl:h-6 text-indigo-500" /> {t('quantity')}</h3>
                   {!isEditingQuantity ? (
                      <button onClick={() => setIsEditingQuantity(true)} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                   ) : (
                      <div className="flex gap-3">
                        <button onClick={handleSaveQuantity} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                        <button onClick={() => setIsEditingQuantity(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                      </div>
                   )}
                </div>
                {isEditingQuantity ? (
                   <input 
                     className="w-full border-2 border-slate-200 rounded-xl p-3 text-base xl:text-lg font-black dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-all" 
                     value={editQuantityText} 
                     onChange={e => setEditQuantityText(e.target.value)} 
                     autoFocus
                   />
                ) : (
                   <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-center shadow-inner">
                      <span className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{sample.quantity || '未定'}</span>
                   </div>
                )}
             </Card>

             <Card className="p-6 xl:p-10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-base xl:text-lg flex items-center gap-3 uppercase tracking-wider"><Target className="w-5 h-5 xl:w-6 xl:h-6 text-emerald-500" /> {t('application')}</h3>
                   {!isEditingApp ? (
                      <button onClick={() => setIsEditingApp(true)} className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90"><PencilLine className="w-4 h-4 xl:w-5 xl:h-5" /></button>
                   ) : (
                      <div className="flex gap-3">
                        <button onClick={handleSaveApplication} className="text-emerald-600 hover:scale-110 transition-transform"><Save className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                        <button onClick={() => setIsEditingApp(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="w-5 h-5 xl:w-6 xl:h-6" /></button>
                      </div>
                   )}
                </div>
                {isEditingApp ? (
                   <textarea className="w-full border-2 border-slate-200 rounded-2xl p-4 text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-h-[120px] transition-all" value={editAppText} onChange={e => setEditAppText(e.target.value)} />
                ) : (
                   <p className="text-slate-800 dark:text-slate-200 text-sm xl:text-base font-bold italic bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 leading-relaxed tracking-tight shadow-inner">{sample.application || t('noApplicationProvided')}</p>
                )}
             </Card>
          </div>

          <div className="lg:col-span-2">
             <Card className="p-6 xl:p-10 h-full border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900/40">
                <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-black text-base xl:text-lg flex items-center gap-3 uppercase tracking-wider"><Activity className="w-5 h-5 xl:w-6 xl:h-6 text-amber-500" /> {t('statusHistory')}</h3>
                   <button onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="text-[10px] xl:text-xs font-black uppercase tracking-widest py-2.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"><Plus className="w-4 h-4" /> Add Update</button>
                </div>
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-6 space-y-10 pl-10 py-4">
                   {historyItems.map((item) => (
                     <div key={item.id} className="relative group">
                        <div className="absolute -left-[51px] top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-700 group-hover:border-blue-500 group-hover:scale-125 transition-all"></div>
                        <div className="flex items-center gap-4 mb-3">
                           <span className="font-black text-xs xl:text-sm text-slate-400 uppercase tracking-widest">{item.date}</span>
                           <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all">
                              <button onClick={() => {
                                setEditingHistoryId(item.id);
                                setNewHistoryText(item.text);
                                setNewHistoryDate(item.date);
                              }} className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-90"><PencilLine className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteHistory(item.id)} className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-base xl:text-lg leading-relaxed tracking-tight">{item.text}</p>
                     </div>
                   ))}
                   {historyItems.length === 0 && (
                     <div className="text-slate-400 italic font-bold text-sm xl:text-base py-4">No history records found.</div>
                   )}
                </div>
             </Card>
          </div>
       </div>

       {(isAddingHistory || editingHistoryId) && (
         <Modal isOpen={true} onClose={() => { setIsAddingHistory(false); setEditingHistoryId(null); setNewHistoryText(''); }} title={editingHistoryId ? "Update Record" : "Add Status Update"}>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATE</label>
                    <input type="date" className="w-full p-4 border-2 rounded-xl font-black text-base xl:text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-all" value={newHistoryDate} onChange={(e) => setNewHistoryDate(e.target.value)} />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Details</label>
                  <textarea 
                    className="w-full h-48 p-5 border-2 rounded-2xl font-bold text-base xl:text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                    placeholder="Describe the status change or event..." 
                    value={newHistoryText} 
                    onChange={(e) => setNewHistoryText(e.target.value)} 
                    autoFocus
                  />
               </div>
               <div className="flex justify-end gap-3 pt-6">
                  <Button variant="secondary" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); setNewHistoryText(''); }}>Cancel</Button>
                  <Button onClick={editingHistoryId ? () => handleSaveHistoryItem({id: editingHistoryId, date: newHistoryDate, text: newHistoryText}) : handleAddHistory} className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-black uppercase tracking-widest">
                    <Save className="w-5 h-5 mr-1" /> {editingHistoryId ? 'Update Record' : 'Save Record'}
                  </Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default SampleProfile;
