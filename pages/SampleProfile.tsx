
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus, TestStatus, ProductCategory, CrystalType, ProductForm, SampleDocLink } from '../types';
import { Card, Badge, Button, StatusIcon, DaysCounter, Modal, getUrgencyLevel, parseLocalDate } from '../components/Common';
import { ArrowLeft, Box, Save, X, Plus, ExternalLink, Activity, Target, PencilLine, Ruler, Clock, ClipboardList, Trash2, Link as LinkIcon, FileText, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';

const SampleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, customers, setSamples, t, tagOptions, syncSampleToCatalog } = useApp();

  const sample = samples.find(s => s.id === id);
  const customer = customers.find(c => c.id === sample?.customerId);

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editSample, setEditSample] = useState<Partial<Sample>>({});
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingSKU, setIsEditingSKU] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  
  const [editAppText, setEditAppText] = useState('');
  const [editDetailsText, setEditDetailsText] = useState('');
  const [editTrackingText, setEditTrackingText] = useState('');
  const [editQuantityText, setEditQuantityText] = useState('');
  const [editSKUText, setEditSKUText] = useState('');
  const [editCategoryText, setEditCategoryText] = useState('');
  const [editNicknameText, setEditNicknameText] = useState('');
  const [editPlanText, setEditPlanText] = useState('');
  const [editPlanDate, setEditPlanDate] = useState('');

  // Link Management State
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  const [historyItems, setHistoryItems] = useState<{id: string, date: string, text: string}[]>([]);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [newHistoryText, setNewHistoryText] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (sample) {
      setEditSample(sample);
      setEditAppText(sample.application || '');
      setEditDetailsText(sample.sampleDetails || '');
      setEditTrackingText(sample.trackingNumber || '');
      setEditQuantityText(sample.quantity || '');
      setEditSKUText(sample.sampleSKU || '');
      setEditCategoryText(sample.productCategory?.join(', ') || '');
      setEditNicknameText(sample.nickname || '');
      setEditPlanText(sample.upcomingPlan || '');
      setEditPlanDate(sample.nextActionDate || format(new Date(), 'yyyy-MM-dd'));
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
        id: `hist_${idx}_${Date.now()}`,
        date: match ? match[1] : format(new Date(), 'yyyy-MM-dd'),
        text: match ? match[2].trim() : part
      };
    });
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(items);
  };

  const serializeHistory = (items: typeof historyItems): string => {
    const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.map(item => `【${item.date}】${item.text}`).join(' ||| ');
  };

  const saveSampleUpdate = (fields: Partial<Sample>) => {
    if (!sample) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setSamples(prev => prev.map(s => s.id === id ? { 
      ...s, 
      lastStatusUpdate: today,
      ...fields
    } : s));
  };

  const handleDeleteSample = () => {
    if (!sample) return;
    if (window.confirm(t('confirmDeleteSample'))) {
      setSamples(prev => prev.filter(s => s.id !== id));
      navigate('/samples');
    }
  };

  const handleSaveSpecs = () => {
    if (!sample || !editSample) return;
    const categories = editCategoryText.split(',').map(c => c.trim() as ProductCategory).filter(c => c);
    const crystal = editSample.crystalType || sample.crystalType || '';
    const catStr = categories.join(' ');
    const form = editSample.productForm || sample.productForm || '';
    const orig = editSample.originalSize || sample.originalSize || '';
    const proc = editSample.processedSize || sample.processedSize ? ` > ${editSample.processedSize || sample.processedSize}` : '';
    const nickname = editNicknameText.trim();
    
    const newName = `${crystal} ${catStr} ${form} - ${orig}${proc}${nickname ? ` (${nickname})` : ''}`.trim();
    const today = format(new Date(), 'yyyy-MM-dd');

    const updatedSample = { 
      ...sample, 
      ...editSample, 
      productCategory: categories,
      nickname: nickname,
      sampleName: newName,
      productType: newName,
      lastStatusDate: today
    } as Sample;

    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    syncSampleToCatalog(updatedSample);
    setIsEditingSpecs(false);
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !sample) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    const title = newLinkTitle.trim() || `Link ${ (sample.docLinks || []).length + 1 }`;
    const newLink: SampleDocLink = { title, url };
    const currentLinks = sample.docLinks || [];
    saveSampleUpdate({ docLinks: [...currentLinks, newLink] });
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleDeleteLink = (linkToDelete: SampleDocLink) => {
    if (!sample) return;
    if (confirm('Delete this link?')) {
      const updatedLinks = (sample.docLinks || []).filter(l => l.url !== linkToDelete.url || l.title !== linkToDelete.title);
      saveSampleUpdate({ docLinks: updatedLinks });
    }
  };

  const handleStartEditLink = (index: number, link: SampleDocLink) => {
    setEditingLinkIndex(index);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
  };

  const handleSaveEditLink = () => {
    if (!sample || editingLinkIndex === null) return;
    let url = editLinkUrl.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    
    const updatedLinks = [...(sample.docLinks || [])];
    updatedLinks[editingLinkIndex] = { title: editLinkTitle.trim() || `Link ${editingLinkIndex + 1}`, url: url || '#' };
    saveSampleUpdate({ docLinks: updatedLinks });
    setEditingLinkIndex(null);
  };

  const handleSaveStatus = () => {
    if (!sample || !editSample) return;
    saveSampleUpdate({ status: editSample.status || sample.status });
    setIsEditingStatus(false);
  };

  const handleSaveTest = () => {
    if (!sample || !editSample) return;
    saveSampleUpdate({ testStatus: editSample.testStatus || sample.testStatus });
    setIsEditingTest(false);
  };

  const handleSaveContext = () => {
    saveSampleUpdate({ application: editAppText, sampleDetails: editDetailsText });
    setIsEditingContext(false);
  };

  const handleSaveTracking = () => {
    saveSampleUpdate({ trackingNumber: editTrackingText });
    setIsEditingTracking(false);
  };

  const handleSaveQuantity = () => {
    saveSampleUpdate({ quantity: editQuantityText });
    setIsEditingQuantity(false);
  };

  const handleSaveSKU = () => {
    saveSampleUpdate({ sampleSKU: editSKUText });
    setIsEditingSKU(false);
  };

  const handleSavePlan = () => {
    saveSampleUpdate({ upcomingPlan: editPlanText, nextActionDate: editPlanDate });
    setIsEditingPlan(false);
  };

  const handleSaveHistoryItem = (item: {id: string, date: string, text: string}) => {
    const updatedHistory = historyItems.map(i => i.id === item.id ? item : i);
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory), lastStatusDate: updatedHistory[0]?.date });
    setEditingHistoryId(null);
  };

  const handleAddHistory = () => {
    if (!newHistoryText) return;
    const newItem = { id: `new_${Date.now()}`, date: newHistoryDate || format(new Date(), 'yyyy-MM-dd'), text: newHistoryText };
    const updatedHistory = [newItem, ...historyItems];
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory), lastStatusDate: updatedHistory[0]?.date });
    setIsAddingHistory(false);
    setNewHistoryText('');
    setNewHistoryDate('');
  };

  if (!sample) return <div className="p-8 text-center font-black uppercase text-slate-400">Sample not found.</div>;

  const isTestFinished = sample.testStatus === 'Finished' || sample.testStatus === 'Terminated';
  const urgency = isTestFinished ? 'none' : getUrgencyLevel(sample.nextActionDate);
  const urgencyClass = isTestFinished 
    ? "bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800"
    : urgency === 'urgent' ? "bg-rose-50 border-rose-100" 
    : urgency === 'warning' ? "bg-amber-50 border-amber-200" 
    : "bg-slate-50 border-slate-200";

  const cardBaseClass = "p-8 xl:p-10 shadow-sm border border-slate-100 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900/40 relative overflow-hidden transition-all";
  const titleClass = "font-black text-sm xl:text-base flex items-center gap-3 uppercase tracking-widest text-slate-900 dark:text-white";
  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const valueClass = "font-black text-slate-900 dark:text-white text-sm xl:text-base text-right";

  return (
    <div className="space-y-8 xl:space-y-12 animate-in fade-in duration-500 pb-20">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90">
             <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
           </button>
           <div>
              <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">{sample.sampleName}</h1>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">Customer</span>
                 <div 
                    onClick={() => navigate(`/customers/${sample.customerId}`)}
                    className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-black text-sm xl:text-lg cursor-pointer hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-800 shadow-sm"
                  >
                    {sample.customerName}
                  </div>
              </div>
           </div>
         </div>
         <Button variant="danger" onClick={handleDeleteSample} className="flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg active:scale-95">
           <Trash2 size={20} />
           <span className="font-black uppercase tracking-widest text-sm">{t('deleteSample')}</span>
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-8">
          <Card className={`p-6 xl:p-8 border-l-4 border-l-blue-600 flex flex-col justify-center shadow-sm rounded-[1.5rem] transition-all ${isEditingStatus ? 'ring-4 ring-blue-500/20' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className={labelClass}>{t('currentStatus')}</span>
               <button onClick={() => setIsEditingStatus(!isEditingStatus)} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-90">
                 <PencilLine className="w-4 h-4" />
               </button>
             </div>
             {isEditingStatus ? (
                <div className="flex gap-2">
                   <select className="flex-1 border-2 border-slate-100 rounded-xl p-2 text-sm font-bold dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500" value={editSample.status} onChange={e => setEditSample({...editSample, status: e.target.value})}>
                      {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                   </select>
                   <button onClick={handleSaveStatus} className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Save size={18}/></button>
                </div>
             ) : (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-white truncate uppercase">{t(sample.status as any)}</span>
                </div>
             )}
          </Card>
          <DaysCounter date={sample.lastStatusDate} label={t('daysSinceUpdate')} type="elapsed" onDateChange={(d) => saveSampleUpdate({ lastStatusDate: d })} />
          <Card className={`p-6 xl:p-8 flex flex-col justify-center shadow-sm rounded-[1.5rem] transition-all ${isEditingTest ? 'ring-4 ring-blue-500/20' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className={labelClass}>{t('testFinished')}</span>
               <button onClick={() => setIsEditingTest(!isEditingTest)} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-90 transition-all"><PencilLine className="w-4 h-4" /></button>
             </div>
             {isEditingTest ? (
               <div className="flex gap-2">
                 <select className="flex-1 border-2 border-slate-100 rounded-xl p-2 text-sm font-bold dark:bg-slate-800" value={editSample.testStatus} onChange={e => setEditSample({...editSample, testStatus: e.target.value as TestStatus})}>
                    <option value="Ongoing">{t('filterTestOngoing')}</option>
                    <option value="Finished">{t('filterTestFinished')}</option>
                    <option value="Terminated">{t('projectTerminated')}</option>
                 </select>
                 <button onClick={handleSaveTest} className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Save size={18}/></button>
               </div>
             ) : (
               <div className="flex h-10 items-center">
                  {sample.testStatus === 'Finished' ? <Badge color="green">{t('filterTestFinished')}</Badge> : sample.testStatus === 'Terminated' ? <Badge color="red">{t('projectTerminated')}</Badge> : <Badge color="yellow">{t('filterTestOngoing')}</Badge>}
               </div>
             )}
          </Card>
          <Card className={`p-6 xl:p-8 flex flex-col justify-center shadow-sm rounded-[1.5rem] transition-all ${isEditingTracking ? 'ring-4 ring-blue-500/20' : ''}`}>
             <div className="flex justify-between items-center mb-3">
               <span className={labelClass}>{t('tracking')}</span>
               <button onClick={() => setIsEditingTracking(!isEditingTracking)} className="p-1.5 rounded-lg bg-emerald-600 text-white active:scale-90 transition-all"><PencilLine className="w-4 h-4" /></button>
             </div>
             {isEditingTracking ? (
                <div className="flex gap-2">
                  <input className="flex-1 border-2 border-slate-100 rounded-xl p-2 text-sm font-mono font-bold dark:bg-slate-800" value={editTrackingText} onChange={e => setEditTrackingText(e.target.value)} />
                  <button onClick={handleSaveTracking} className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Save size={18}/></button>
                </div>
             ) : (
               <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-mono text-lg xl:text-xl font-black truncate">
                  <ExternalLink size={18} /> <span>{sample.trackingNumber || '-'}</span>
               </div>
             )}
          </Card>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          <div className="space-y-8">
             <Card className={cardBaseClass}>
                <div className="flex justify-between items-center mb-10">
                   <h3 className={titleClass}><Box className="w-6 h-6 text-blue-600" /> SPECS</h3>
                   <button onClick={() => setIsEditingSpecs(!isEditingSpecs)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-90"><PencilLine size={20}/></button>
                </div>
                <div className="space-y-6">
                   {isEditingSpecs ? (
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className={labelClass}>{t('crystal')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.crystalType} onChange={e => setEditSample({...editSample, crystalType: e.target.value as CrystalType})}>
                              {tagOptions.crystalType.map(opt => <option key={opt} value={opt}>{t(opt as any)}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('category')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editCategoryText} onChange={e => setEditCategoryText(e.target.value)} placeholder="e.g. 纳米级, 团聚" />
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('form')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.productForm} onChange={e => setEditSample({...editSample, productForm: e.target.value as ProductForm})}>
                              {tagOptions.productForm.map(opt => <option key={opt} value={opt}>{t(opt as any)}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('grading')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.isGraded} onChange={e => setEditSample({...editSample, isGraded: e.target.value as GradingStatus})}>
                               <option value="Graded">{t('graded')}</option>
                               <option value="Ungraded">{t('ungraded')}</option>
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className={labelClass}>{t('origLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} placeholder="e.g. 125 nm" />
                           </div>
                           <div className="space-y-1">
                              <label className={labelClass}>{t('procLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} placeholder="e.g. 100 nm" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('nickname')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editNicknameText} onChange={e => setEditNicknameText(e.target.value)} placeholder="e.g. Test Nickname" />
                        </div>
                        <Button onClick={handleSaveSpecs} className="w-full mt-4 bg-blue-600">Save Changes</Button>
                     </div>
                   ) : (
                     <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {[
                          { label: 'CRYSTAL', value: t(sample.crystalType as any) },
                          { label: 'CATEGORY', value: sample.productCategory?.map(c => t(c as any)).join(', ') },
                          { label: 'FORM', value: t(sample.productForm as any) },
                          { label: 'GRADING', value: sample.isGraded?.toUpperCase() || 'UNGRADED' },
                          { label: 'ORIGINAL', value: sample.originalSize },
                          { label: 'PROCESSED', value: sample.processedSize || '-' },
                          { label: 'NICKNAME / 昵称', value: sample.nickname || '-' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-4">
                            <span className={labelClass}>{item.label}</span>
                            <span className={valueClass}>{item.value || '-'}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </Card>
             <Card className={cardBaseClass}>
                <div className="flex justify-between items-center mb-8">
                   <h3 className={titleClass}><Ruler className="w-6 h-6 text-indigo-600" /> {t('quantity')}</h3>
                   <button onClick={() => setIsEditingQuantity(!isEditingQuantity)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm active:scale-90"><PencilLine size={20}/></button>
                </div>
                {isEditingQuantity ? (
                   <div className="space-y-4">
                      <input className="w-full p-4 border-2 border-slate-100 rounded-2xl text-xl font-black dark:bg-slate-800" value={editQuantityText} onChange={e => setEditQuantityText(e.target.value)} autoFocus />
                      <Button onClick={handleSaveQuantity} className="w-full">Update Qty</Button>
                   </div>
                ) : (
                   <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 text-center shadow-inner group">
                      <span className="text-xl xl:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{sample.quantity || '未定'}</span>
                   </div>
                )}
             </Card>
             <Card className={cardBaseClass}>
                <div className="flex justify-between items-center mb-8">
                   <h3 className={titleClass}><ClipboardList className="w-6 h-6 text-slate-600" /> SKU</h3>
                   <button onClick={() => setIsEditingSKU(!isEditingSKU)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm active:scale-90"><PencilLine size={20}/></button>
                </div>
                {isEditingSKU ? (
                   <div className="space-y-4">
                      <input className="w-full p-4 border-2 border-slate-100 rounded-2xl text-lg font-mono font-bold dark:bg-slate-800" value={editSKUText} onChange={e => setEditSKUText(e.target.value)} autoFocus />
                      <Button onClick={handleSaveSKU} className="w-full">Update SKU</Button>
                   </div>
                ) : (
                   <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 text-center shadow-inner group">
                      <span className="text-sm xl:text-base font-black text-slate-600 dark:text-slate-400 font-mono tracking-wider">{sample.sampleSKU || 'NO SKU'}</span>
                   </div>
                )}
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
             <div className={`${cardBaseClass} ${urgencyClass} border-2 px-10 py-10 transition-colors`}>
                <button onClick={() => setIsEditingPlan(true)} className={`absolute top-8 right-8 p-3 rounded-2xl bg-emerald-600 text-white shadow-lg active:scale-90 transition-all z-10 ${isTestFinished ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isTestFinished}>
                  <PencilLine size={24} />
                </button>
                <div className="flex items-center gap-6 mb-8">
                   <div className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                      <Clock className="w-8 h-8 xl:w-10 xl:h-10 text-slate-900 dark:text-white" />
                   </div>
                   <div>
                      <h4 className="font-black text-[10px] xl:text-xs text-slate-400 tracking-[0.2em] uppercase mb-1.5">UPCOMING PLAN</h4>
                      <div className="flex items-center gap-3">
                         <span className="text-lg xl:text-xl font-black text-slate-900 dark:text-white tracking-tight">DDL: {isTestFinished ? 'N/A' : (sample.nextActionDate || 'TBD')}</span>
                         {urgency === 'urgent' && <Badge color="red">URGENT</Badge>}
                      </div>
                   </div>
                </div>
                <p className="text-base xl:text-xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic opacity-80 pl-2">
                   {isTestFinished ? <span className="text-slate-400">Sample testing concluded. No further upcoming plans.</span> : (sample.upcomingPlan || <span className="text-slate-400">No upcoming plan logged for this sample.</span>)}
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-auto">
               <Card className={cardBaseClass}>
                  <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-50 dark:border-slate-800">
                     <h3 className={titleClass}><Target className="w-6 h-6 text-emerald-500" /> USAGE & DETAILS</h3>
                     <button onClick={() => setIsEditingContext(!isEditingContext)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm active:scale-90"><PencilLine size={20}/></button>
                  </div>
                  
                  {isEditingContext ? (
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className={labelClass}>{t('application')}</label>
                          <textarea className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 min-h-[100px] text-sm" value={editAppText} onChange={e => setEditAppText(e.target.value)} placeholder="Enter application details..." />
                       </div>
                       <div className="space-y-2">
                          <label className={labelClass}>Internal Details</label>
                          <textarea className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 min-h-[100px] text-sm" value={editDetailsText} onChange={e => setEditDetailsText(e.target.value)} placeholder="Enter internal notes or spec details..." />
                       </div>
                       <Button onClick={handleSaveContext} className="w-full bg-blue-600">Save Module Info</Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-400">
                             <Target size={14} />
                             <span className={labelClass}>{t('application')}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 text-sm xl:text-base font-bold italic border-l-4 border-emerald-100 dark:border-emerald-900/40 pl-4 leading-relaxed">
                             {sample.application || t('noApplicationProvided')}
                          </p>
                       </div>
                       
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-400">
                             <FileText size={14} />
                             <span className={labelClass}>Internal Details</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 text-sm xl:text-base font-bold border-l-4 border-blue-100 dark:border-blue-900/40 pl-4 leading-relaxed">
                             {sample.sampleDetails || "No internal details provided."}
                          </p>
                       </div>
                    </div>
                  )}
               </Card>

               <Card className={cardBaseClass}>
                  <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-50 dark:border-slate-800">
                     <h3 className={titleClass}><LinkIcon className="w-6 h-6 text-blue-500" /> {t('fileLinks')}</h3>
                  </div>
                  <div className="space-y-4">
                     {/* Add New Link Section */}
                     <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <input 
                           className="w-full p-2.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs xl:text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500"
                           placeholder="Link Title (e.g. Test Report)..."
                           value={newLinkTitle}
                           onChange={(e) => setNewLinkTitle(e.target.value)}
                        />
                        <div className="flex gap-2">
                           <input 
                              className="flex-1 p-2.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs xl:text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500"
                              placeholder="Paste URL here..."
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                           />
                           <button onClick={handleAddLink} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 active:scale-90">
                              <Plus size={18} />
                           </button>
                        </div>
                     </div>

                     {/* Link List Section */}
                     <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {(sample.docLinks || []).length > 0 ? (sample.docLinks || []).map((link, idx) => (
                          <div key={idx} className="space-y-2">
                             {editingLinkIndex === idx ? (
                               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 space-y-3">
                                  <input 
                                     className="w-full p-2 border-2 border-white dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                                     value={editLinkTitle}
                                     onChange={e => setEditLinkTitle(e.target.value)}
                                     placeholder="Title"
                                  />
                                  <input 
                                     className="w-full p-2 border-2 border-white dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900"
                                     value={editLinkUrl}
                                     onChange={e => setEditLinkUrl(e.target.value)}
                                     placeholder="URL"
                                  />
                                  <div className="flex gap-2 pt-1">
                                     <button onClick={() => setEditingLinkIndex(null)} className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500">Cancel</button>
                                     <button onClick={handleSaveEditLink} className="flex-1 p-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase text-white flex items-center justify-center gap-1"><Check size={12}/> Save</button>
                                  </div>
                               </div>
                             ) : (
                               <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group shadow-sm">
                                  <a 
                                     href={link.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="text-blue-600 dark:text-blue-400 font-bold text-xs xl:text-sm truncate flex items-center gap-2 hover:underline flex-1 pr-2"
                                  >
                                     <ExternalLink size={14} className="shrink-0" /> <span className="truncate">{link.title}</span>
                                  </a>
                                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => handleStartEditLink(idx, link)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all">
                                        <PencilLine size={14} />
                                     </button>
                                     <button onClick={() => handleDeleteLink(link)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                        <Trash2 size={14} />
                                     </button>
                                  </div>
                               </div>
                             )}
                          </div>
                        )) : (
                          <div className="text-center py-10 text-slate-300 italic text-xs xl:text-sm border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-3xl">
                             No links added yet.
                          </div>
                        )}
                     </div>
                  </div>
               </Card>

               <Card className={`${cardBaseClass} md:col-span-2`}>
                  <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-50 dark:border-slate-800">
                     <h3 className={titleClass}><Activity className="w-6 h-6 text-amber-500" /> STATUS DETAILS / HISTORY</h3>
                     <button onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
                        <Plus size={14} /> ADD
                     </button>
                  </div>
                  <div className="relative border-l-4 border-slate-50 dark:border-slate-800 ml-5 space-y-10 pl-10 py-4">
                     {historyItems.length > 0 ? historyItems.map((item) => (
                       <div key={item.id} className="relative group">
                          <div className="absolute -left-[50px] top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 group-hover:border-blue-500 group-hover:scale-125 transition-all"></div>
                          <div className="flex flex-col gap-1 mb-2">
                             <span className="font-black text-[10px] xl:text-xs text-slate-400 uppercase tracking-widest">{item.date}</span>
                             <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all absolute right-0 top-0">
                                <button onClick={() => { setEditingHistoryId(item.id); setNewHistoryText(item.text); setNewHistoryDate(item.date); }} className="p-1.5 rounded-lg bg-emerald-600 text-white active:scale-90"><PencilLine size={12} /></button>
                                <button onClick={() => { if(confirm('Delete?')) { const updated = historyItems.filter(i => i.id !== item.id); saveSampleUpdate({ statusDetails: serializeHistory(updated) }); setHistoryItems(updated); } }} className="p-1.5 rounded-lg bg-red-600 text-white active:scale-90"><X size={12} /></button>
                             </div>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-bold text-sm xl:text-base leading-relaxed tracking-tight">{item.text}</p>
                       </div>
                     )) : (
                       <div className="text-slate-400 italic font-bold py-10">No history records yet.</div>
                     )}
                  </div>
               </Card>
             </div>
          </div>
       </div>

       {isEditingPlan && (
         <Modal isOpen={true} onClose={() => setIsEditingPlan(false)} title="Update Sample Plan">
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className={labelClass}>Plan Details (下一步)</label>
                  <textarea className="w-full h-40 p-5 border-2 rounded-3xl font-bold text-base dark:bg-slate-800 outline-none focus:border-blue-500 transition-all" value={editPlanText} onChange={(e) => setEditPlanText(e.target.value)} />
               </div>
               <div className="space-y-2">
                  <label className={labelClass}>Target Date (DDL)</label>
                  <input type="date" className="w-full p-4 border-2 rounded-2xl font-black text-lg dark:bg-slate-800 outline-none focus:border-blue-500" value={editPlanDate} onChange={(e) => setEditPlanDate(e.target.value)} />
               </div>
               <div className="flex justify-end gap-3 pt-6">
                  <Button variant="secondary" onClick={() => setIsEditingPlan(false)}>Cancel</Button>
                  <Button onClick={handleSavePlan} className="bg-blue-600 px-10">Save Plan</Button>
               </div>
            </div>
         </Modal>
       )}

       {(isAddingHistory || editingHistoryId) && (
         <Modal isOpen={true} onClose={() => { setIsAddingHistory(false); setEditingHistoryId(null); }} title={editingHistoryId ? "Update Record" : "Add History Update"}>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className={labelClass}>DATE</label>
                 <input type="date" className="w-full p-4 border-2 rounded-2xl font-black dark:bg-slate-800" value={newHistoryDate} onChange={(e) => setNewHistoryDate(e.target.value)} />
               </div>
               <div className="space-y-2">
                  <label className={labelClass}>DETAILS</label>
                  <textarea className="w-full h-48 p-5 border-2 rounded-3xl font-bold dark:bg-slate-800" placeholder="Describe the status change..." value={newHistoryText} onChange={(e) => setNewHistoryText(e.target.value)} />
               </div>
               <div className="flex justify-end gap-3 pt-6">
                  <Button variant="secondary" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); }}>Cancel</Button>
                  <Button onClick={editingHistoryId ? () => handleSaveHistoryItem({id: editingHistoryId, date: newHistoryDate, text: newHistoryText}) : handleAddHistory} className="bg-blue-600 px-10">
                    {editingHistoryId ? 'Update Record' : 'Save Record'}
                  </Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default SampleProfile;
