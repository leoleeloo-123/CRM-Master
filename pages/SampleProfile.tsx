
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus, TestStatus } from '../types';
import { Card, Button, Badge, StatusIcon, DaysCounter, Modal } from '../components/Common';
import { ArrowLeft, Box, Save, X, Edit, Plus, Trash2, CalendarDays, ExternalLink, Activity, Target, PencilLine, Ruler } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';

const SampleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, customers, setSamples, t, tagOptions, masterProducts, syncSampleToCatalog } = useApp();

  const sample = samples.find(s => s.id === id);
  const customer = customers.find(c => c.id === sample?.customerId);

  // Editable States
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

  // Status History State
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

  if (!sample) return <div className="p-8">Sample not found.</div>;

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

  return (
    <div className="space-y-6 xl:space-y-8 animate-in fade-in pb-10">
       <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl xl:text-4xl font-bold text-slate-900 dark:text-white">{sample.sampleName}</h1>
              <Badge color="blue">{sample.sampleSKU || 'No SKU'}</Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
               Customer: <span className="font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/customers/${sample.customerId}`)}>{sample.customerName}</span>
            </p>
         </div>
       </div>

       {/* Top Metrics Row */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-8">
          <Card className={`p-4 border-l-4 border-l-blue-600 flex flex-col justify-center relative ${isEditingStatus ? 'ring-2 ring-blue-500' : ''}`}>
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('currentStatus')}</span>
               {!isEditingStatus ? (
                 <button onClick={() => setIsEditingStatus(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={12} /></button>
               ) : (
                 <div className="flex gap-2">
                    <button onClick={handleSaveStatus} className="text-emerald-600"><Save size={14} /></button>
                    <button onClick={() => setIsEditingStatus(false)} className="text-red-500"><X size={14} /></button>
                 </div>
               )}
             </div>
             {isEditingStatus ? (
                <select className="w-full border rounded p-1 text-sm dark:bg-slate-800 dark:border-slate-600" value={editSample.status} onChange={e => setEditSample({...editSample, status: e.target.value as SampleStatus})}>
                   {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{renderOption(s)}</option>)}
                </select>
             ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{renderOption(sample.status)}</span>
                </div>
             )}
          </Card>

          <DaysCounter date={sample.lastStatusDate} label={t('daysSinceUpdate')} type="elapsed" />

          <Card className={`p-4 flex flex-col justify-center relative ${isEditingTest ? 'ring-2 ring-blue-500' : ''}`}>
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('testFinished')}</span>
               {!isEditingTest ? (
                 <button onClick={() => setIsEditingTest(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={12} /></button>
               ) : (
                 <div className="flex gap-2">
                    <button onClick={handleSaveTest} className="text-emerald-600"><Save size={14} /></button>
                    <button onClick={() => setIsEditingTest(false)} className="text-red-500"><X size={14} /></button>
                 </div>
               )}
             </div>
             <div className="flex">
              {isEditingTest ? (
                <select 
                  className="w-full border rounded p-1 text-sm dark:bg-slate-800 dark:border-slate-600" 
                  value={editSample.testStatus || 'Ongoing'} 
                  onChange={e => setEditSample({...editSample, testStatus: e.target.value as TestStatus})}
                >
                    <option value="Ongoing">{t('filterTestOngoing')}</option>
                    <option value="Finished">{t('filterTestFinished')}</option>
                    <option value="Terminated">{t('projectTerminated')}</option>
                </select>
              ) : (
                getTestBadge(sample.testStatus || 'Ongoing')
              )}
             </div>
          </Card>

          <Card className={`p-4 flex flex-col justify-center relative ${isEditingTracking ? 'ring-2 ring-blue-500' : ''}`}>
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('tracking')}</span>
               {!isEditingTracking ? (
                 <button onClick={() => setIsEditingTracking(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={12} /></button>
               ) : (
                 <div className="flex gap-2">
                    <button onClick={handleSaveTracking} className="text-emerald-600"><Save size={14} /></button>
                    <button onClick={() => setIsEditingTracking(false)} className="text-red-500"><X size={14} /></button>
                 </div>
               )}
             </div>
             {isEditingTracking ? (
               <input 
                 className="w-full border rounded p-1 text-sm dark:bg-slate-800 dark:border-slate-600 font-mono" 
                 value={editTrackingText} 
                 onChange={e => setEditTrackingText(e.target.value)}
                 autoFocus
               />
             ) : (
               <div className="flex items-center gap-2 text-blue-600 font-mono text-lg truncate">
                  <ExternalLink size={16} /> <span>{sample.trackingNumber || '-'}</span>
               </div>
             )}
          </Card>
       </div>

       {/* Content Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
             {/* Specs Card - Quantity Split Out */}
             <Card className="p-6">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-wide"><Box size={20} className="text-blue-500" /> {t('specs')}</h3>
                   {!isEditingSpecs ? (
                     <button onClick={() => setIsEditingSpecs(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={16} /></button>
                   ) : (
                     <div className="flex gap-2">
                       <button onClick={handleSaveSpecs} className="text-emerald-600"><Save size={20} /></button>
                       <button onClick={() => setIsEditingSpecs(false)} className="text-red-500"><X size={20} /></button>
                     </div>
                   )}
                </div>
                <div className="space-y-4">
                   {isEditingSpecs ? (
                     <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500">Crystal</label>
                          <select className="w-full border rounded p-1.5 text-sm dark:bg-slate-900" value={editSample.crystalType} onChange={e => setEditSample({...editSample, crystalType: e.target.value as any})}>
                            {tagOptions.crystalType.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500">Form</label>
                          <select className="w-full border rounded p-1.5 text-sm dark:bg-slate-900" value={editSample.productForm} onChange={e => setEditSample({...editSample, productForm: e.target.value as any})}>
                            {tagOptions.productForm.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-xs font-bold text-slate-500">Orig Size</label>
                             <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} />
                           </div>
                           <div>
                             <label className="text-xs font-bold text-slate-500">Proc Size</label>
                             <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} />
                           </div>
                        </div>
                     </div>
                   ) : (
                     <>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 text-sm">{t('crystal')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{renderOption(sample.crystalType || '-')}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 text-sm">{t('form')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{renderOption(sample.productForm || '-')}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 text-sm">{t('original')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{sample.originalSize || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500 text-sm">{t('processed')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{sample.processedSize || '-'}</span>
                        </div>
                     </>
                   )}
                </div>
             </Card>

             {/* Quantity Card - Independent */}
             <Card className={`p-6 relative ${isEditingQuantity ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-wide"><Ruler size={20} className="text-indigo-500" /> {t('quantity')}</h3>
                   {!isEditingQuantity ? (
                      <button onClick={() => setIsEditingQuantity(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={16} /></button>
                   ) : (
                      <div className="flex gap-2">
                        <button onClick={handleSaveQuantity} className="text-emerald-600"><Save size={18} /></button>
                        <button onClick={() => setIsEditingQuantity(false)} className="text-red-500"><X size={18} /></button>
                      </div>
                   )}
                </div>
                {isEditingQuantity ? (
                   <input 
                     className="w-full border rounded p-2 text-sm dark:bg-slate-900 font-bold" 
                     value={editQuantityText} 
                     onChange={e => setEditQuantityText(e.target.value)} 
                     autoFocus
                   />
                ) : (
                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border text-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{sample.quantity || '未定'}</span>
                   </div>
                )}
             </Card>

             {/* Application Card */}
             <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-wide"><Target size={20} className="text-emerald-500" /> {t('application')}</h3>
                   {!isEditingApp ? (
                      <button onClick={() => setIsEditingApp(true)} className="p-1 rounded bg-[#059669] text-white hover:bg-[#047857] transition-colors"><PencilLine size={16} /></button>
                   ) : (
                      <div className="flex gap-2">
                        <button onClick={handleSaveApplication} className="text-emerald-600"><Save size={18} /></button>
                        <button onClick={() => setIsEditingApp(false)} className="text-red-500"><X size={18} /></button>
                      </div>
                   )}
                </div>
                {isEditingApp ? (
                   <textarea className="w-full border rounded p-3 text-sm dark:bg-slate-900 min-h-[100px]" value={editAppText} onChange={e => setEditAppText(e.target.value)} />
                ) : (
                   <p className="text-slate-700 dark:text-slate-200 text-sm italic bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border leading-relaxed">{sample.application || t('noApplicationProvided')}</p>
                )}
             </Card>
          </div>

          {/* History Column */}
          <div className="lg:col-span-2">
             <Card className="p-6 h-full border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-2 border-b">
                   <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-wide"><Activity size={20} className="text-amber-500" /> {t('statusHistory')}</h3>
                   <Button onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="text-xs py-2 bg-white text-slate-700 border hover:bg-slate-50 rounded-lg px-4 font-bold flex items-center gap-1 shadow-sm"><Plus size={16} /> Add Update</Button>
                </div>
                <div className="relative border-l-2 ml-4 space-y-8 pl-8 py-2">
                   {historyItems.map((item) => (
                     <div key={item.id} className="relative group">
                        <div className="absolute -left-[39px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-400 group-hover:border-blue-500 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-1">
                           <span className="font-mono text-sm font-bold text-slate-400">{item.date}</span>
                           <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                              <button onClick={() => {
                                setEditingHistoryId(item.id);
                                setNewHistoryText(item.text);
                                setNewHistoryDate(item.date);
                              }} className="p-1 rounded bg-[#059669] text-white shadow-sm hover:bg-[#047857]"><PencilLine size={10} /></button>
                              <button onClick={() => handleDeleteHistory(item.id)} className="p-1 rounded bg-red-600 text-white shadow-sm hover:bg-red-700"><Trash2 size={10} /></button>
                           </div>
                        </div>
                        <p className="text-slate-800 dark:text-white font-medium text-sm leading-relaxed">{item.text}</p>
                     </div>
                   ))}
                   {historyItems.length === 0 && (
                     <div className="text-slate-400 italic text-sm py-4">No history records found.</div>
                   )}
                </div>
             </Card>
          </div>
       </div>

       {/* History Modal */}
       {(isAddingHistory || editingHistoryId) && (
         <Modal isOpen={true} onClose={() => { setIsAddingHistory(false); setEditingHistoryId(null); setNewHistoryText(''); }} title={editingHistoryId ? "Update Record" : "Add Status Update"}>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400">DATE</label>
                    <input type="date" className="w-full p-2 border rounded-lg font-bold" value={newHistoryDate} onChange={(e) => setNewHistoryDate(e.target.value)} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Details</label>
                  <textarea 
                    className="w-full h-32 p-3 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Describe the status change or event..." 
                    value={newHistoryText} 
                    onChange={(e) => setNewHistoryText(e.target.value)} 
                    autoFocus
                  />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => { setIsAddingHistory(false); setEditingHistoryId(null); setNewHistoryText(''); }}>Cancel</Button>
                  <Button onClick={editingHistoryId ? () => handleSaveHistoryItem({id: editingHistoryId, date: newHistoryDate, text: newHistoryText}) : handleAddHistory} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save size={18} className="mr-1" /> {editingHistoryId ? 'Update Record' : 'Save Record'}
                  </Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default SampleProfile;
