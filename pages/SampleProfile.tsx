
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sample, SampleStatus, GradingStatus } from '../types';
import { Card, Button, Badge, StatusIcon, DaysCounter, Modal } from '../components/Common';
import { ArrowLeft, Box, Save, X, Edit, Plus, Trash2, CalendarDays, ExternalLink, Activity } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';

const SampleProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, customers, setSamples, t, tagOptions, masterProducts, syncSampleToCatalog } = useApp();

  const sample = samples.find(s => s.id === id);
  const customer = customers.find(c => c.id === sample?.customerId);

  // Editable State
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editSample, setEditSample] = useState<Partial<Sample>>({});
  
  // Status History State
  const [historyItems, setHistoryItems] = useState<{id: string, date: string, text: string}[]>([]);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryDate, setNewHistoryDate] = useState('');
  const [newHistoryText, setNewHistoryText] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (sample) {
      setEditSample(sample);
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
      // Regex to extract date 【YYYY-MM-DD】
      const match = part.match(/【(.*?)】(.*)/);
      if (match) {
        return {
          id: `hist_${idx}`,
          date: match[1],
          text: match[2].trim()
        };
      } else {
        return {
          id: `hist_${idx}`,
          date: format(new Date(), 'yyyy-MM-dd'), // Fallback if no date found
          text: part
        };
      }
    });
    setHistoryItems(items);
  };

  const serializeHistory = (items: typeof historyItems): string => {
    return items.map(item => `【${item.date}】${item.text}`).join(' ||| ');
  };

  const handleSaveSpecs = () => {
    if (!sample || !editSample) return;
    
    // Auto-update sample name if components changed
    if (editSample.productCategory || editSample.crystalType || editSample.productForm) {
       // Logic reused from AppContext/SampleTracker (Sync logic) could be called here or handled manually
       // Simple reconstruction for now:
       const catStr = editSample.productCategory?.map(c => t(c as any)).join(', ') || '';
       const crystal = t((editSample.crystalType || '') as any);
       const form = t((editSample.productForm || '') as any);
       const orig = editSample.originalSize || '';
       const proc = editSample.processedSize ? ` > ${editSample.processedSize}` : '';
       const newName = `${crystal} ${catStr} ${form} - ${orig}${proc}`.trim().replace(/\s+/g, ' ');
       editSample.sampleName = newName;
    }

    const updatedSample = { ...sample, ...editSample } as Sample;
    
    setSamples(prev => prev.map(s => s.id === id ? updatedSample : s));
    
    // Also sync to catalog if needed
    syncSampleToCatalog(updatedSample);
    
    setIsEditingSpecs(false);
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
    
    // Add to top
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

  return (
    <div className="space-y-6 xl:space-y-8 animate-in fade-in">
       {/* Header */}
       <div className="flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl xl:text-4xl font-bold text-slate-900 dark:text-white">{sample.sampleName}</h1>
              <Badge color="blue">{sample.sampleSKU || 'No SKU'}</Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
               Customer: 
               <span className="font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/customers/${sample.customerId}`)}>
                 {sample.customerName}
               </span>
            </p>
         </div>
       </div>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-8 h-auto lg:h-32">
          <Card className="p-4 border-l-4 border-l-blue-500 flex flex-col justify-center">
             <span className="text-xs uppercase font-bold text-slate-400 mb-1">{t('currentStatus')}</span>
             <div className="flex items-center gap-2">
               <StatusIcon status={sample.status} />
               <span className="text-xl font-bold">{renderOption(sample.status)}</span>
             </div>
          </Card>
          <DaysCounter date={sample.lastStatusDate} label={t('daysSinceUpdate')} type="elapsed" />
          <Card className="p-4 flex flex-col justify-center items-center">
             <span className="text-xs uppercase font-bold text-slate-400 mb-2">{t('testFinished')}</span>
             {sample.isTestFinished ? (
               <Badge color="green" >YES / COMPLETED</Badge>
             ) : (
               <Badge color="yellow">ONGOING</Badge>
             )}
          </Card>
          <Card className="p-4 flex flex-col justify-center">
             <span className="text-xs uppercase font-bold text-slate-400 mb-1">{t('tracking')}</span>
             {sample.trackingNumber ? (
               <div className="flex items-center gap-2 text-blue-600 font-mono text-lg">
                  <ExternalLink className="w-4 h-4" /> {sample.trackingNumber}
               </div>
             ) : <span className="text-slate-400">-</span>}
          </Card>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-10">
          {/* Left Column: Specs */}
          <div className="space-y-6">
             <Card className="p-6 xl:p-8">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Box className="w-5 h-5 text-blue-500" /> {t('specs')}
                   </h3>
                   {!isEditingSpecs ? (
                     <button onClick={() => setIsEditingSpecs(true)}><Edit className="w-4 h-4 text-slate-400 hover:text-blue-500" /></button>
                   ) : (
                     <div className="flex gap-2">
                       <button onClick={handleSaveSpecs} className="text-emerald-600"><Save className="w-5 h-5" /></button>
                       <button onClick={() => setIsEditingSpecs(false)} className="text-red-500"><X className="w-5 h-5" /></button>
                     </div>
                   )}
                </div>
                
                <div className="space-y-4">
                   {isEditingSpecs ? (
                     // Edit Mode
                     <div className="space-y-3">
                        <div>
                           <label className="text-xs font-bold text-slate-500">Crystal</label>
                           <select 
                             className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600"
                             value={editSample.crystalType}
                             onChange={e => setEditSample({...editSample, crystalType: e.target.value as any})}
                           >
                             {tagOptions.crystalType.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">Form</label>
                           <select 
                             className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600"
                             value={editSample.productForm}
                             onChange={e => setEditSample({...editSample, productForm: e.target.value as any})}
                           >
                             {tagOptions.productForm.map(t => <option key={t} value={t}>{renderOption(t)}</option>)}
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-500">Orig Size</label>
                            <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600" value={editSample.originalSize} onChange={e => setEditSample({...editSample, originalSize: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500">Proc Size</label>
                            <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600" value={editSample.processedSize} onChange={e => setEditSample({...editSample, processedSize: e.target.value})} />
                          </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500">Quantity</label>
                           <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600" value={editSample.quantity} onChange={e => setEditSample({...editSample, quantity: e.target.value})} />
                        </div>
                         <div>
                           <label className="text-xs font-bold text-slate-500">Application</label>
                           <input className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600" value={editSample.application} onChange={e => setEditSample({...editSample, application: e.target.value})} />
                        </div>
                     </div>
                   ) : (
                     // View Mode
                     <>
                        <div className="flex justify-between">
                           <span className="text-slate-500 text-sm">{t('crystal')}</span>
                           <span className="font-medium text-slate-800 dark:text-white">{renderOption(sample.crystalType || '-')}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500 text-sm">{t('category')}</span>
                           <span className="font-medium text-slate-800 dark:text-white">{sample.productCategory?.map(c => renderOption(c)).join(', ') || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500 text-sm">{t('form')}</span>
                           <span className="font-medium text-slate-800 dark:text-white">{renderOption(sample.productForm || '-')}</span>
                        </div>
                         <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
                           <span className="text-slate-500 text-sm">{t('original')}</span>
                           <span className="font-medium text-slate-800 dark:text-white">{sample.originalSize || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500 text-sm">{t('processed')}</span>
                           <span className="font-medium text-slate-800 dark:text-white">{sample.processedSize || '-'}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
                           <span className="text-slate-500 text-sm">{t('quantity')}</span>
                           <span className="font-bold text-slate-800 dark:text-white">{sample.quantity || '-'}</span>
                        </div>
                         <div className="flex justify-between">
                           <span className="text-slate-500 text-sm">{t('application')}</span>
                           <span className="font-medium text-slate-800 dark:text-white text-right max-w-[150px]">{sample.application || '-'}</span>
                        </div>
                     </>
                   )}
                </div>
             </Card>
          </div>

          {/* Right Column: Status History */}
          <div className="lg:col-span-2">
             <Card className="p-6 xl:p-8 min-h-[500px]">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-bold text-lg flex items-center gap-2">
                     <Activity className="w-5 h-5 text-amber-500" /> {t('statusHistory')}
                   </h3>
                   {!isAddingHistory && (
                     <Button variant="secondary" onClick={() => { setIsAddingHistory(true); setNewHistoryDate(format(new Date(), 'yyyy-MM-dd')); }} className="text-xs py-1">
                       <Plus className="w-4 h-4 mr-1" /> Add Status Update
                     </Button>
                   )}
                </div>

                {isAddingHistory && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800 animate-in fade-in">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                           <label className="text-xs font-bold text-slate-500">Date</label>
                           <input type="date" className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-600" value={newHistoryDate} onChange={e => setNewHistoryDate(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                           <label className="text-xs font-bold text-slate-500">Details</label>
                           <input type="text" className="w-full border rounded p-2 text-sm dark:bg-slate-900 dark:border-slate-600" placeholder="Status update..." value={newHistoryText} onChange={e => setNewHistoryText(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddHistory()} />
                        </div>
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsAddingHistory(false)}>Cancel</Button>
                        <Button onClick={handleAddHistory}>Save Update</Button>
                     </div>
                  </div>
                )}

                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 pl-8 py-2">
                   {historyItems.map((item, index) => (
                     <div key={item.id} className="relative group">
                        {/* Dot */}
                        <div className="absolute -left-[39px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-400 group-hover:border-blue-500 transition-colors"></div>
                        
                        {editingHistoryId === item.id ? (
                           <div className="bg-white dark:bg-slate-900 border rounded p-2 shadow-lg z-10 relative">
                              <div className="flex gap-2 mb-2">
                                 <input type="date" className="border rounded p-1 text-xs dark:bg-slate-800 dark:border-slate-600" value={item.date} onChange={(e) => {
                                    setHistoryItems(prev => prev.map(i => i.id === item.id ? {...i, date: e.target.value} : i));
                                 }} />
                                 <input type="text" className="flex-1 border rounded p-1 text-xs dark:bg-slate-800 dark:border-slate-600" value={item.text} onChange={(e) => {
                                    setHistoryItems(prev => prev.map(i => i.id === item.id ? {...i, text: e.target.value} : i));
                                 }} />
                              </div>
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => setEditingHistoryId(null)} className="text-xs text-slate-500">Cancel</button>
                                 <button onClick={() => handleSaveHistoryItem(item)} className="text-xs text-blue-600 font-bold">Save</button>
                              </div>
                           </div>
                        ) : (
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{item.date}</span>
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => setEditingHistoryId(item.id)} className="text-slate-400 hover:text-blue-500"><Edit className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteHistory(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                              </div>
                              <p className="text-slate-800 dark:text-white text-base">{item.text}</p>
                           </div>
                        )}
                     </div>
                   ))}
                   {historyItems.length === 0 && (
                      <p className="text-slate-400 italic">No history recorded.</p>
                   )}
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
};

export default SampleProfile;
