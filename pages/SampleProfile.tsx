
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus, TestStatus, ProductCategory, CrystalType, ProductForm, SampleDocLink } from '../types';
import { Card, Badge, Button, StatusIcon, DaysCounter, Modal, getUrgencyLevel, parseLocalDate } from '../components/Common';
import { ArrowLeft, Box, Save, X, Plus, ExternalLink, Activity, Target, PencilLine, Ruler, Clock, ClipboardList, Trash2, Link as LinkIcon, FileText, Check, Star, Info, Timer, Calendar, DollarSign, CreditCard, Truck, Hash } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';

const SampleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, customers, setSamples, t, tagOptions, syncSampleToCatalog, language } = useApp();

  const sample = samples.find(s => s.id === id);
  const customer = customers.find(c => c.id === sample?.customerId);

  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editSample, setEditSample] = useState<Partial<Sample>>({});
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingOther, setIsEditingOther] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  
  const [editAppText, setEditAppText] = useState('');
  const [editDetailsText, setEditDetailsText] = useState('');
  const [editTrackingText, setEditTrackingText] = useState('');
  const [editQuantityText, setEditQuantityText] = useState('');
  const [editSKUText, setEditSKUText] = useState('');
  const [editCategoryText, setEditCategoryText] = useState('');
  const [editNicknameText, setEditNicknameText] = useState('');
  const [editPlanText, setEditPlanText] = useState('');
  const [editPlanDate, setEditPlanDate] = useState('');

  // Fee state
  const [tempFee, setTempFee] = useState<Partial<Sample>>({});

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
      setTempFee({
        isPaid: sample.isPaid || false,
        feeCategory: sample.feeCategory || t('defaultFeeCategory'),
        feeType: sample.feeType || t('income'),
        actualUnitPrice: sample.actualUnitPrice || '',
        standardUnitPrice: sample.standardUnitPrice || '',
        originationDate: sample.originationDate || '',
        transactionDate: sample.transactionDate || '',
        feeStatus: sample.feeStatus || '等待中',
        currency: sample.currency || 'USD',
        balance: sample.balance || '',
        feeComment: sample.feeComment || ''
      });
      parseHistory(sample.statusDetails);
    }
  }, [sample, t]);

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
      lastStatusDate: today,
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

    const updatedSampleData = { 
      ...editSample, 
      productCategory: categories,
      nickname: nickname,
      sampleName: newName,
      productType: newName,
      quantity: editQuantityText
    };

    saveSampleUpdate(updatedSampleData);
    syncSampleToCatalog({ ...sample, ...updatedSampleData } as Sample);
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
    saveSampleUpdate({ 
      status: editSample.status || sample.status,
      testStatus: editSample.testStatus || sample.testStatus
    });
    setIsEditingStatus(false);
  };

  const handleSaveOther = () => {
    saveSampleUpdate({ 
      trackingNumber: editTrackingText,
      sampleSKU: editSKUText
    });
    setIsEditingOther(false);
  };

  const handleSaveContext = () => {
    saveSampleUpdate({ application: editAppText, sampleDetails: editDetailsText });
    setIsEditingContext(false);
  };

  const handleSavePlan = () => {
    saveSampleUpdate({ upcomingPlan: editPlanText, nextActionDate: editPlanDate });
    setIsEditingPlan(false);
  };

  const handleSaveFee = () => {
    saveSampleUpdate({ ...tempFee });
    setIsEditingFee(false);
  };

  const handleToggleStar = () => {
    if (!sample) return;
    const currentlyStarred = !!sample.isStarredSample;
    const confirmMsg = currentlyStarred ? t('confirmUnstarSample') : t('confirmStarSample');
    
    if (confirm(confirmMsg)) {
      const nextStarred = !currentlyStarred;
      let nextDate = sample.nextActionDate;
      
      if (nextStarred && customer?.nextActionDate) {
        nextDate = customer.nextActionDate;
      }
      
      saveSampleUpdate({ 
        isStarredSample: nextStarred,
        nextActionDate: nextDate
      });
    }
  };

  const handleSaveHistoryItem = (item: {id: string, date: string, text: string}) => {
    const updatedHistory = historyItems.map(i => i.id === item.id ? item : i);
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory) });
    setEditingHistoryId(null);
  };

  const handleAddHistory = () => {
    if (!newHistoryText) return;
    const newItem = { id: `new_${Date.now()}`, date: newHistoryDate || format(new Date(), 'yyyy-MM-dd'), text: newHistoryText };
    const updatedHistory = [newItem, ...historyItems];
    updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory) });
    setIsAddingHistory(false);
    setNewHistoryText('');
    setNewHistoryDate('');
  };

  if (!sample) return <div className="p-8 text-center font-black uppercase text-slate-400">Sample not found.</div>;

  const isTestFinished = sample.testStatus === 'Finished' || sample.testStatus === 'Terminated';
  const urgency = isTestFinished ? 'none' : getUrgencyLevel(sample.nextActionDate);

  const daysRemaining = useMemo(() => {
    if (!sample?.nextActionDate) return null;
    const targetDate = parseLocalDate(sample.nextActionDate);
    if (!isValid(targetDate)) return null;
    return differenceInDays(startOfDay(targetDate), startOfDay(new Date()));
  }, [sample?.nextActionDate]);

  // Aging logic for the integrated counter
  const agingDate = sample.lastStatusDate ? parseLocalDate(sample.lastStatusDate) : new Date();
  const agingDays = Math.abs(differenceInDays(startOfDay(new Date()), startOfDay(agingDate)));
  let agingColor = "text-emerald-500";
  if (agingDays >= 30) agingColor = "text-red-500";
  else if (agingDays >= 7) agingColor = "text-amber-500";

  // Standardized Design Classes
  const headerClass = "px-6 py-4 bg-slate-100 dark:bg-slate-800/80 flex justify-between items-center border-b border-slate-200 dark:border-slate-700";
  const titleClass = "font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider";
  const editBtnStyle = "p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 hover:shadow-sm transition-all active:scale-90 shadow-none";
  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const valueClass = "font-black text-slate-900 dark:text-white text-sm xl:text-base text-right";
  const contentTextClass = "text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight";

  return (
    <div className="space-y-8 xl:space-y-12 animate-in fade-in duration-500 pb-20">
       {/* Navigation Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
           <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 active:scale-90">
             <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
           </button>
           <div>
              <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4 uppercase">{sample.sampleName}</h1>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('customer')}</span>
                 <div 
                    onClick={() => navigate(`/customers/${sample.customerId}`)}
                    className="px-6 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-black text-sm xl:text-lg cursor-pointer hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-800 shadow-sm"
                  >
                    {sample.customerName}
                  </div>
              </div>
           </div>
         </div>
         <div className="flex items-center gap-3">
           <Button variant="danger" onClick={handleDeleteSample} className="flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg active:scale-95">
             <Trash2 size={20} />
             <span className="font-black uppercase tracking-widest text-sm">{t('deleteSample')}</span>
           </Button>
         </div>
       </div>

       {/* Main Content Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Left Column (Narrow Cards) */}
          <div className="space-y-8">
             {/* Integrated Status Card (Status + Test + Aging) */}
             <Card className={`overflow-hidden border shadow-sm rounded-3xl transition-all ${isEditingStatus ? 'ring-4 ring-blue-500/20 border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className={headerClass}>
                   <h3 className={titleClass}><Activity className="w-5 h-5 text-blue-600" /> {t('status')}</h3>
                   <button onClick={() => setIsEditingStatus(!isEditingStatus)} className={editBtnStyle}>
                     {isEditingStatus ? <X className="w-4 h-4" /> : <PencilLine className="w-4 h-4" />}
                   </button>
                </div>
                <div className="p-6 xl:px-8 xl:py-6 bg-white dark:bg-slate-900/40">
                   {isEditingStatus ? (
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className={labelClass}>{t('currentStatus')}</label>
                            <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold dark:bg-slate-800 dark:text-white outline-none focus:border-blue-500 shadow-inner" value={editSample.status} onChange={e => setEditSample({...editSample, status: e.target.value})}>
                               {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className={labelClass}>{t('testFinished')}</label>
                            <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold dark:bg-slate-800 shadow-inner" value={editSample.testStatus} onChange={e => setEditSample({...editSample, testStatus: e.target.value as TestStatus})}>
                               <option value="Ongoing">{t('filterTestOngoing')}</option>
                               <option value="Finished">{t('filterTestFinished')}</option>
                               <option value="Terminated">{t('projectTerminated')}</option>
                            </select>
                         </div>
                         <Button onClick={handleSaveStatus} className="w-full bg-blue-600 py-3 font-black shadow-lg shadow-blue-600/20"><Save size={18} className="mr-2" /> {t('save')}</Button>
                      </div>
                   ) : (
                      <div className="grid grid-cols-3 gap-6 items-center">
                        <div className="space-y-2">
                           <span className={labelClass}>{t('currentStatus')}</span>
                           <div className="flex h-8 items-center">
                              <Badge color="blue"><span className="text-[10px] xl:text-xs font-black uppercase">{t(sample.status as any)}</span></Badge>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <span className={labelClass}>{t('testFinished')}</span>
                           <div className="flex h-8 items-center">
                              {sample.testStatus === 'Finished' ? <Badge color="green"><span className="text-[10px] xl:text-xs font-black uppercase">{t('filterTestFinished')}</span></Badge> : sample.testStatus === 'Terminated' ? <Badge color="red"><span className="text-[10px] xl:text-xs font-black uppercase">{t('projectTerminated')}</span></Badge> : <Badge color="yellow"><span className="text-[10px] xl:text-xs font-black uppercase">{t('filterTestOngoing')}</span></Badge>}
                           </div>
                        </div>
                        <div className="space-y-1 text-right">
                           <span className={labelClass}>{t('updateStatus')}</span>
                           <div className="flex items-baseline justify-end gap-1.5 group relative">
                              <span className={`text-3xl xl:text-4xl font-black ${agingColor} tabular-nums tracking-tight`}>{agingDays}</span>
                              <span className="text-[9px] font-black text-slate-400 uppercase">Days</span>
                           </div>
                        </div>
                      </div>
                   )}
                </div>
             </Card>

             {/* Specs Card */}
             <Card className="overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
                <div className={headerClass}>
                   <h3 className={titleClass}><Box className="w-5 h-5 text-blue-600" /> {t('specs')}</h3>
                   <button onClick={() => setIsEditingSpecs(!isEditingSpecs)} className={editBtnStyle}><PencilLine size={16}/></button>
                </div>
                <div className="p-8 space-y-6">
                   {isEditingSpecs ? (
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className={labelClass}>{t('crystal')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editSample.crystalType} onChange={e => setEditSample({...editSample, crystalType: e.target.value as CrystalType})}>
                              {tagOptions.crystalType.map(opt => <option key={opt} value={opt}>{t(opt as any)}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('category')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editCategoryText} onChange={e => setEditCategoryText(e.target.value)} placeholder="e.g. 纳米级, 团聚" />
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('form')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editSample.productForm} onChange={e => setEditSample({...editSample, productForm: e.target.value as ProductForm})}>
                              {tagOptions.productForm.map(opt => <option key={opt} value={opt}>{t(opt as any)}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('grading')}</label>
                           <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editSample.isGraded} onChange={e => setEditSample({...editSample, isGraded: e.target.value as GradingStatus})}>
                               <option value="Graded">{t('graded')}</option>
                               <option value="Ungraded">{t('ungraded')}</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('quantity')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editQuantityText} onChange={e => setEditQuantityText(e.target.value)} placeholder="e.g. 500g" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className={labelClass}>{t('origLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} placeholder="e.g. 125 nm" />
                           </div>
                           <div className="space-y-1">
                              <label className={labelClass}>{t('procLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} placeholder="e.g. 100 nm" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className={labelClass}>{t('nickname')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 shadow-inner" value={editNicknameText} onChange={e => setEditNicknameText(e.target.value)} placeholder="e.g. Test Nickname" />
                        </div>
                        <Button onClick={handleSaveSpecs} className="w-full mt-4 bg-blue-600 shadow-lg shadow-blue-600/20 font-black">{t('save')}</Button>
                     </div>
                   ) : (
                     <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {[
                          { label: t('crystal'), value: t(sample.crystalType as any) },
                          { label: t('category'), value: sample.productCategory?.map(c => t(c as any)).join(', ') },
                          { label: t('form'), value: t(sample.productForm as any) },
                          { label: t('grading'), value: sample.isGraded === 'Graded' ? t('graded') : t('ungraded') },
                          { label: t('quantity'), value: sample.quantity },
                          { label: t('original'), value: sample.originalSize },
                          { label: t('processed'), value: sample.processedSize || '-' },
                          { label: t('nickname'), value: sample.nickname || '-' }
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

             {/* Fee Information Block */}
             <Card className={`overflow-hidden shadow-sm border rounded-3xl transition-all ${isEditingFee ? 'ring-4 ring-blue-500/20 border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className={headerClass}>
                   <h3 className={titleClass}><CreditCard className="w-5 h-5 text-amber-600" /> {t('feeInfo')}</h3>
                   <button onClick={() => setIsEditingFee(!isEditingFee)} className={editBtnStyle}>
                      {isEditingFee ? <X className="w-4 h-4" /> : <PencilLine className="w-4 h-4" />}
                   </button>
                </div>
                <div className="p-8 space-y-6 bg-white dark:bg-slate-900/40">
                   {isEditingFee ? (
                      <div className="space-y-6">
                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">{t('isPaid')}</span>
                            <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800">
                               <button 
                                 onClick={() => setTempFee({...tempFee, isPaid: false})} 
                                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!tempFee.isPaid ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}
                               >
                                 {t('free')}
                               </button>
                               <button 
                                 onClick={() => setTempFee({...tempFee, isPaid: true})} 
                                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${tempFee.isPaid ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}
                               >
                                 {t('paid')}
                               </button>
                            </div>
                         </div>
                         
                         {tempFee.isPaid && (
                           <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('feeCategory')}</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.feeCategory} onChange={e => setTempFee({...tempFee, feeCategory: e.target.value})} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('feeType')}</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-60" value={tempFee.feeType} readOnly />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('actualUnitPrice')}</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.actualUnitPrice} onChange={e => setTempFee({...tempFee, actualUnitPrice: e.target.value})} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('standardUnitPrice')}</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.standardUnitPrice} onChange={e => setTempFee({...tempFee, standardUnitPrice: e.target.value})} />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('originationDate')}</label>
                                    <input type="date" className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.originationDate} onChange={e => setTempFee({...tempFee, originationDate: e.target.value})} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('transactionDate')}</label>
                                    <input type="date" className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.transactionDate} onChange={e => setTempFee({...tempFee, transactionDate: e.target.value})} />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('feeStatus')}</label>
                                    <select className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.feeStatus} onChange={e => setTempFee({...tempFee, feeStatus: e.target.value})}>
                                       {tagOptions.feeStatus.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                 </div>
                                 <div className="space-y-1">
                                    <label className={labelClass}>{t('currency')}</label>
                                    <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.currency} onChange={e => setTempFee({...tempFee, currency: e.target.value})} placeholder="e.g. USD" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className={labelClass}>{t('balance')}</label>
                                 <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner" value={tempFee.balance} onChange={e => setTempFee({...tempFee, balance: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                 <label className={labelClass}>{t('feeComment')}</label>
                                 <textarea className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold dark:bg-slate-800 shadow-inner h-20" value={tempFee.feeComment} onChange={e => setTempFee({...tempFee, feeComment: e.target.value})} />
                              </div>
                           </div>
                         )}
                         
                         <Button onClick={handleSaveFee} className="w-full bg-blue-600 py-3 font-black shadow-lg shadow-blue-600/20"><Save size={18} className="mr-2" /> {t('save')}</Button>
                      </div>
                   ) : (
                      <div className="space-y-6">
                         <div className="flex justify-between items-center">
                            <span className={labelClass}>{t('isPaid')}</span>
                            {sample.isPaid ? <Badge color="yellow">{t('paid')}</Badge> : <Badge color="gray">{t('free')}</Badge>}
                         </div>
                         
                         {sample.isPaid && (
                           <div className="divide-y divide-slate-50 dark:divide-slate-800 pt-2">
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('feeCategory')}</span><span className={valueClass}>{sample.feeCategory}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('feeType')}</span><span className={valueClass}>{sample.feeType}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('actualUnitPrice')}</span><span className={valueClass}>{sample.actualUnitPrice}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('standardUnitPrice')}</span><span className={valueClass}>{sample.standardUnitPrice}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('originationDate')}</span><span className={valueClass}>{sample.originationDate}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('transactionDate')}</span><span className={valueClass}>{sample.transactionDate || '-'}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('feeStatus')}</span><span className={valueClass}><Badge color="blue">{sample.feeStatus}</Badge></span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('currency')}</span><span className={valueClass}>{sample.currency}</span></div>
                              <div className="flex justify-between py-2"><span className={labelClass}>{t('balance')}</span><span className="font-black text-amber-600 text-base">{sample.balance}</span></div>
                              <div className="pt-4 space-y-1">
                                 <span className={labelClass}>{t('feeComment')}</span>
                                 <p className="text-xs font-bold text-slate-500 italic leading-relaxed">{sample.feeComment || '-'}</p>
                              </div>
                           </div>
                         )}
                      </div>
                   )}
                </div>
             </Card>
          </div>

          {/* Right Column (Wider Cards) */}
          <div className="lg:col-span-2 space-y-8">
             {/* Plan Banner - Style aligned with Customer Profile */}
             <Card className="overflow-hidden border shadow-sm rounded-3xl bg-white dark:bg-slate-900/40">
                <div className={headerClass}>
                   <h3 className={titleClass}><Clock className="w-5 h-5 text-blue-600" /> {t('upcomingPlanHeader')}</h3>
                   <button onClick={() => setIsEditingPlan(true)} className={editBtnStyle}>
                      <PencilLine size={20} />
                   </button>
                </div>
                <div className="p-8">
                   <div className={contentTextClass + " whitespace-pre-wrap mb-10"}>
                      {isTestFinished ? (
                         <span className="text-slate-400">Sample testing concluded. No further upcoming plans.</span>
                      ) : (
                         sample.upcomingPlan || <span className="text-slate-400">No upcoming plan logged for this sample.</span>
                      )}
                   </div>
                   
                   <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase">
                      <div className="flex items-center gap-3">
                         <Calendar size={14} className="text-slate-400" />
                         <span className="font-black text-slate-900 dark:text-white text-xs xl:text-sm">DDL: {isTestFinished ? 'N/A' : (sample.nextActionDate || 'TBD')}</span>
                         {!isTestFinished && daysRemaining !== null && (
                            <Badge color={urgency === 'urgent' ? 'red' : urgency === 'warning' ? 'yellow' : 'green'}>
                               {Math.abs(daysRemaining)} {daysRemaining < 0 ? (language === 'en' ? 'Days Overdue' : '天逾期') : (language === 'en' ? 'Days Remaining' : '天剩余')}
                            </Badge>
                         )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <button 
                            onClick={handleToggleStar}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all active:scale-95 ${sample.isStarredSample ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-100 text-slate-300'}`}
                         >
                           <Star size={12} className={sample.isStarredSample ? 'fill-amber-400' : ''} />
                           <span className="text-[10px] font-black uppercase tracking-wider">{t('starred')}</span>
                         </button>
                         {sample.isStarredSample && (
                           <span className="text-[9px] font-bold text-amber-500/80 animate-pulse">SYNCED</span>
                         )}
                      </div>
                   </div>
                </div>
             </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Usage Info */}
               <Card className="overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
                  <div className={headerClass}>
                     <h3 className={titleClass}><Target className="w-5 h-5 text-emerald-500" /> {t('application')} & {t('sampleInfo')}</h3>
                     <button onClick={() => setIsEditingContext(!isEditingContext)} className={editBtnStyle}><PencilLine size={16}/></button>
                  </div>
                  <div className="p-8">
                    {isEditingContext ? (
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className={labelClass}>{t('application')}</label>
                            <textarea className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 min-h-[100px] text-sm outline-none focus:border-blue-500 transition-all shadow-inner" value={editAppText} onChange={e => setEditAppText(e.target.value)} placeholder="Enter application details..." />
                         </div>
                         <div className="space-y-2">
                            <label className={labelClass}>{t('sampleInfo')} (Internal)</label>
                            <textarea className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800 min-h-[100px] text-sm outline-none focus:border-blue-500 transition-all shadow-inner" value={editDetailsText} onChange={e => setEditDetailsText(e.target.value)} placeholder="Enter internal notes or spec details..." />
                         </div>
                         <Button onClick={handleSaveContext} className="w-full bg-blue-600 font-black shadow-lg shadow-blue-600/20">{t('save')}</Button>
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
                               <span className={labelClass}>{t('sampleInfo')}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 text-sm xl:text-base font-bold border-l-4 border-blue-100 dark:border-blue-900/40 pl-4 leading-relaxed">
                               {sample.sampleDetails || "No internal details provided."}
                            </p>
                         </div>
                      </div>
                    )}
                  </div>
               </Card>

               {/* Other Info & Links Module */}
               <Card className="overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
                  <div className={headerClass}>
                     <h3 className={titleClass}><Info className="w-5 h-5 text-blue-600" /> {t('other')}</h3>
                     <button onClick={() => setIsEditingOther(!isEditingOther)} className={editBtnStyle}>
                        {isEditingOther ? <X className="w-4 h-4" /> : <PencilLine className="w-4 h-4" />}
                     </button>
                  </div>
                  <div className="p-8 space-y-6">
                     {/* SKU & Tracking View */}
                     {isEditingOther ? (
                        <div className="space-y-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                           <div className="space-y-2">
                              <label className={labelClass}>SKU</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-mono font-bold dark:bg-slate-800 shadow-inner" value={editSKUText} onChange={e => setEditSKUText(e.target.value)} />
                           </div>
                           <div className="space-y-2">
                              <label className={labelClass}>{t('tracking')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-mono font-bold dark:bg-slate-800 shadow-inner" value={editTrackingText} onChange={e => setEditTrackingText(e.target.value)} />
                           </div>
                           <Button onClick={handleSaveOther} className="w-full bg-blue-600 py-3 font-black shadow-lg shadow-blue-600/20"><Save size={18} className="mr-2" /> {t('save')}</Button>
                        </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-6">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <Hash size={12} />
                                 <span className={labelClass}>SKU</span>
                              </div>
                              <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs xl:text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 block truncate">
                                 {sample.sampleSKU || 'N/A'}
                              </span>
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <Truck size={12} />
                                 <span className={labelClass}>{t('tracking')}</span>
                              </div>
                              <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-xs xl:text-sm bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50 block truncate">
                                 {sample.trackingNumber || 'N/A'}
                              </span>
                           </div>
                        </div>
                     )}

                     {/* Hyperlinks Section */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                           <LinkIcon size={14} />
                           <span className={labelClass}>{t('fileLinks')}</span>
                        </div>
                        
                        <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                           <input 
                              className="w-full p-2.5 border-2 border-white dark:border-slate-800 rounded-xl text-xs xl:text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500 shadow-sm"
                              placeholder="Link Title (e.g. Test Report)..."
                              value={newLinkTitle}
                              onChange={(e) => setNewLinkTitle(e.target.value)}
                           />
                           <div className="flex gap-2">
                              <input 
                                 className="flex-1 p-2.5 border-2 border-white dark:border-slate-800 rounded-xl text-xs xl:text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500 shadow-sm"
                                 placeholder="Paste URL here..."
                                 value={newLinkUrl}
                                 onChange={(e) => setNewLinkUrl(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                              />
                              <button onClick={handleAddLink} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 active:scale-90 transition-all">
                                 <Plus size={18} />
                              </button>
                           </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
                           {(sample.docLinks || []).length > 0 ? (sample.docLinks || []).map((link, idx) => (
                             <div key={idx} className="space-y-2">
                                {editingLinkIndex === idx ? (
                                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 space-y-3 shadow-md">
                                     <input 
                                        className="w-full p-2 border-2 border-white dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 shadow-inner"
                                        value={editLinkTitle}
                                        onChange={e => setEditLinkTitle(e.target.value)}
                                        placeholder="Title"
                                     />
                                     <input 
                                        className="w-full p-2 border-2 border-white dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 shadow-inner"
                                        value={editLinkUrl}
                                        onChange={e => setEditLinkUrl(e.target.value)}
                                        placeholder="URL"
                                     />
                                     <div className="flex gap-2 pt-1">
                                        <button onClick={() => setEditingLinkIndex(null)} className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500">{t('cancel')}</button>
                                        <button onClick={handleSaveEditLink} className="flex-1 p-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase text-white flex items-center justify-center gap-1"><Check size={12}/> {t('save')}</button>
                                     </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group shadow-sm hover:border-blue-200 transition-colors">
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
               </div>
            </Card>

            {/* History Timeline */}
            <Card className="md:col-span-2 overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
                  <div className={headerClass}>
                     <h3 className={titleClass}><Activity className="w-5 h-5 text-amber-500" /> {t('statusHistory')}</h3>
                     <button onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all active:scale-95 shadow-sm">
                        <Plus size={14} /> {t('add')}
                     </button>
                  </div>
                  <div className="p-8 relative">
                    <div className="border-l-4 border-slate-100 dark:border-slate-800 ml-5 space-y-10 pl-10 py-4">
                       {historyItems.length > 0 ? historyItems.map((item) => (
                         <div key={item.id} className="relative group">
                            <div className="absolute -left-[50px] top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 group-hover:border-blue-500 group-hover:scale-125 transition-all"></div>
                            <div className="flex flex-col gap-1 mb-2">
                               <span className="font-black text-[10px] xl:text-xs text-slate-400 uppercase tracking-widest">{item.date}</span>
                               <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all absolute right-0 top-0">
                                  <button onClick={() => { setEditingHistoryId(item.id); setNewHistoryText(item.text); setNewHistoryDate(item.date); }} className="p-1.5 rounded-lg bg-emerald-600 text-white active:scale-90 shadow-sm transition-all hover:bg-emerald-700"><PencilLine size={12} /></button>
                                  <button onClick={() => { if(confirm('Delete?')) { const updated = historyItems.filter(i => i.id !== item.id); saveSampleUpdate({ statusDetails: serializeHistory(updated) }); setHistoryItems(updated); } }} className="p-1.5 rounded-lg bg-red-600 text-white active:scale-90 shadow-sm transition-all hover:bg-red-700"><X size={12} /></button>
                               </div>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm xl:text-base leading-relaxed tracking-tight">{item.text}</p>
                         </div>
                       )) : (
                         <div className="text-slate-400 italic font-bold py-10 text-center uppercase tracking-widest opacity-40">{t('statusNoAction')}</div>
                       )}
                    </div>
                  </div>
               </Card>
             </div>
          </div>
       </div>

       {/* Modals */}
       {isEditingPlan && (
         <Modal isOpen={true} onClose={() => setIsEditingPlan(false)} title={t('upcomingPlanHeader')}>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className={labelClass}>{t('upcomingPlanHeader')}</label>
                  <textarea className="w-full h-40 p-5 border-2 rounded-3xl font-bold text-base dark:bg-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner" value={editPlanText} onChange={(e) => setEditPlanText(e.target.value)} />
               </div>
               <div className="space-y-2">
                  <label className={labelClass}>Target Date (DDL)</label>
                  <input type="date" className="w-full p-4 border-2 rounded-2xl font-black text-lg dark:bg-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner" value={editPlanDate} onChange={(e) => setEditPlanDate(e.target.value)} />
               </div>
               <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                  <Button variant="secondary" onClick={() => setIsEditingPlan(false)}>{t('cancel')}</Button>
                  <Button onClick={handleSavePlan} className="bg-blue-600 px-10 font-black shadow-lg shadow-blue-600/20">{t('save')}</Button>
               </div>
            </div>
         </Modal>
       )}

       {(isAddingHistory || editingHistoryId) && (
         <Modal isOpen={true} onClose={() => { setIsAddingHistory(false); setEditingHistoryId(null); }} title={editingHistoryId ? t('edit') : t('add')}>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className={labelClass}>{t('dateLabel')}</label>
                 <input type="date" className="w-full p-4 border-2 rounded-2xl font-black dark:bg-slate-800 outline-none focus:border-blue-500 shadow-inner" value={newHistoryDate} onChange={(e) => setNewHistoryDate(e.target.value)} />
               </div>
               <div className="space-y-2">
                  <label className={labelClass}>{t('contentLabel')}</label>
                  <textarea className="w-full h-48 p-5 border-2 rounded-3xl font-bold dark:bg-slate-800 outline-none focus:border-blue-500 shadow-inner" placeholder={t('describeInteraction')} value={newHistoryText} onChange={(e) => setNewHistoryText(e.target.value)} />
               </div>
               <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                  <Button variant="secondary" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); }}>{t('cancel')}</Button>
                  <Button onClick={editingHistoryId ? () => handleSaveHistoryItem({id: editingHistoryId, date: newHistoryDate, text: newHistoryText}) : handleAddHistory} className="bg-blue-600 px-10 font-black shadow-lg shadow-blue-600/20">
                    {editingHistoryId ? t('save') : t('saveLog')}
                  </Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default SampleProfile;
