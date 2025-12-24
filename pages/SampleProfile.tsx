
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus, TestStatus, ProductCategory } from '../types';
import { Card, Button, Badge, StatusIcon, DaysCounter, Modal, getUrgencyLevel } from '../components/Common';
import { ArrowLeft, Box, Save, X, Plus, ExternalLink, Activity, Target, PencilLine, Ruler, Clock } from 'lucide-react';
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
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  
  const [editAppText, setEditAppText] = useState('');
  const [editTrackingText, setEditTrackingText] = useState('');
  const [editQuantityText, setEditQuantityText] = useState('');
  const [editCategoryText, setEditCategoryText] = useState('');
  const [editPlanText, setEditPlanText] = useState('');
  const [editPlanDate, setEditPlanDate] = useState('');

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
      setEditCategoryText(sample.productCategory?.join(', ') || '');
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
    const categories = editCategoryText.split(',').map(c => c.trim() as ProductCategory).filter(c => c);
    const updatedSample = { ...sample, ...editSample, productCategory: categories } as Sample;
    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    syncSampleToCatalog(updatedSample);
    setIsEditingSpecs(false);
  };

  const handleSaveStatus = () => {
    if (!sample || !editSample) return;
    saveSampleUpdate({ status: editSample.status || sample.status, lastStatusDate: format(new Date(), 'yyyy-MM-dd') });
    setIsEditingStatus(false);
  };

  const handleSaveTest = () => {
    if (!sample || !editSample) return;
    saveSampleUpdate({ testStatus: editSample.testStatus || sample.testStatus, lastStatusDate: format(new Date(), 'yyyy-MM-dd') });
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

  const handleSavePlan = () => {
    saveSampleUpdate({ upcomingPlan: editPlanText, nextActionDate: editPlanDate });
    setIsEditingPlan(false);
  };

  const handleSaveHistoryItem = (item: {id: string, date: string, text: string}) => {
    const updatedHistory = historyItems.map(i => i.id === item.id ? item : i);
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory), lastStatusDate: item.date });
    setEditingHistoryId(null);
  };

  const handleAddHistory = () => {
    if (!newHistoryText) return;
    const newItem = { id: `new_${Date.now()}`, date: newHistoryDate || format(new Date(), 'yyyy-MM-dd'), text: newHistoryText };
    const updatedHistory = [newItem, ...historyItems];
    setHistoryItems(updatedHistory);
    saveSampleUpdate({ statusDetails: serializeHistory(updatedHistory), lastStatusDate: newItem.date });
    setIsAddingHistory(false);
    setNewHistoryText('');
    setNewHistoryDate('');
  };

  if (!sample) return <div className="p-8 text-center font-black uppercase text-slate-400">Sample not found.</div>;

  const urgency = getUrgencyLevel(sample.nextActionDate);
  const urgencyClass = urgency === 'urgent' ? "bg-rose-50 border-rose-100" : urgency === 'warning' ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200";

  // Common styles
  const cardBaseClass = "p-8 xl:p-10 shadow-sm border border-slate-100 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900/40 relative overflow-hidden transition-all";
  const titleClass = "font-black text-sm xl:text-base flex items-center gap-3 uppercase tracking-widest text-slate-900 dark:text-white";
  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const valueClass = "font-black text-slate-900 dark:text-white text-sm xl:text-base text-right";

  return (
    <div className="space-y-8 xl:space-y-12 animate-in fade-in duration-500 pb-20">
       <div className="flex items-center gap-6">
         <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{sample.sampleName}</h1>
              <Badge color="blue">{sample.sampleSKU || 'NO SKU'}</Badge>
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] xl:text-xs tracking-widest mt-3">
               CUSTOMER: <span className="text-blue-600 cursor-pointer hover:underline transition-all" onClick={() => navigate(`/customers/${sample.customerId}`)}>{sample.customerName}</span>
            </p>
         </div>
       </div>

       {/* Top Metric Cards */}
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

          <DaysCounter date={sample.lastStatusDate} label={t('daysSinceUpdate')} type="elapsed" />

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

       {/* Main Grid Content */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Left Column: Specs & Quantity */}
          <div className="space-y-8">
             <Card className={cardBaseClass}>
                <div className="flex justify-between items-center mb-10">
                   <h3 className={titleClass}><Box className="w-6 h-6 text-blue-600" /> SPECS</h3>
                   <button onClick={() => setIsEditingSpecs(!isEditingSpecs)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-90"><PencilLine size={20}/></button>
                </div>
                <div className="space-y-6">
                   {isEditingSpecs ? (
                     <div className="space-y-4">
                        {['crystalType', 'productForm', 'isGraded'].map(field => (
                          <div key={field} className="space-y-1">
                             <label className={labelClass}>{t(field as any)}</label>
                             <select className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={(editSample as any)[field]} onChange={e => setEditSample({...editSample, [field]: e.target.value})}>
                                {field === 'isGraded' ? <>
                                   <option value="Graded">{t('graded')}</option>
                                   <option value="Ungraded">{t('ungraded')}</option>
                                </> : tagOptions[field === 'crystalType' ? 'crystalType' : 'productForm'].map(opt => <option key={opt} value={opt}>{t(opt as any)}</option>)}
                             </select>
                          </div>
                        ))}
                        <div className="space-y-1">
                           <label className={labelClass}>{t('category')}</label>
                           <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editCategoryText} onChange={e => setEditCategoryText(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className={labelClass}>{t('origLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className={labelClass}>{t('procLabel')}</label>
                              <input className="w-full p-3 border-2 border-slate-100 rounded-2xl font-bold dark:bg-slate-800" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} />
                           </div>
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
                          { label: 'PROCESSED', value: sample.processedSize || '-' }
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
                   <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 text-center shadow-inner group">
                      <span className="text-3xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{sample.quantity || '未定'}</span>
                   </div>
                )}
             </Card>
          </div>

          {/* Right Column: Upcoming Plan & Application & History */}
          <div className="lg:col-span-2 space-y-8">
             {/* Upcoming Plan Section */}
             <div className={`${cardBaseClass} ${urgencyClass} border-2 px-10 py-10`}>
                <button onClick={() => setIsEditingPlan(true)} className="absolute top-8 right-8 p-3 rounded-2xl bg-emerald-600 text-white shadow-lg active:scale-90 transition-all z-10">
                  <PencilLine size={24} />
                </button>
                <div className="flex items-center gap-6 mb-8">
                   <div className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                      <Clock className="w-8 h-8 xl:w-10 xl:h-10 text-slate-900 dark:text-white" />
                   </div>
                   <div>
                      <h4 className="font-black text-[10px] xl:text-xs text-slate-400 tracking-[0.2em] uppercase mb-1.5">UPCOMING PLAN</h4>
                      <div className="flex items-center gap-3">
                         <span className="text-lg xl:text-xl font-black text-slate-900 dark:text-white tracking-tight">DDL: {sample.nextActionDate || 'TBD'}</span>
                         {urgency === 'urgent' && <Badge color="red">URGENT</Badge>}
                      </div>
                   </div>
                </div>
                <p className="text-base xl:text-xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic opacity-80 pl-2">
                   {sample.upcomingPlan || <span className="text-slate-400">No upcoming plan logged for this sample.</span>}
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-auto">
               {/* Application Card */}
               <Card className={cardBaseClass}>
                  <div className="flex justify-between items-center mb-8">
                     <h3 className={titleClass}><Target className="w-6 h-6 text-emerald-500" /> APPLICATION</h3>
                     <button onClick={() => setIsEditingApp(!isEditingApp)} className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm active:scale-90"><PencilLine size={20}/></button>
                  </div>
                  {isEditingApp ? (
                     <div className="space-y-4">
                        <textarea className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold dark:bg-slate-800 min-h-[150px]" value={editAppText} onChange={e => setEditAppText(e.target.value)} />
                        <Button onClick={handleSaveApplication} className="w-full">Save Details</Button>
                     </div>
                  ) : (
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner min-h-[160px] flex items-center">
                        <p className="text-slate-800 dark:text-slate-200 text-sm xl:text-lg font-bold italic leading-relaxed tracking-tight text-center w-full">
                           {sample.application || t('noApplicationProvided')}
                        </p>
                     </div>
                  )}
               </Card>

               {/* History Card */}
               <Card className={cardBaseClass}>
                  <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-50 dark:border-slate-800">
                     <h3 className={titleClass}><Activity className="w-6 h-6 text-amber-500" /> STATUS DETAILS / HISTORY</h3>
                     <button onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
                        <Plus size={14} /> ADD
                     </button>
                  </div>
                  <div className="relative border-l-4 border-slate-50 dark:border-slate-800 ml-5 space-y-10 pl-10 py-4">
                     {historyItems.length > 0 ? historyItems.slice(0, 3).map((item) => (
                       <div key={item.id} className="relative group">
                          {/* Dot aligned to border-l-4 */}
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

       {/* Modals for Editing (Consolidated for better UX) */}
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
