import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank, Exhibition } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter, getUrgencyLevel, Modal, parseLocalDate } from '../components/Common';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star, PencilLine, ChevronDown, ChevronUp, Ruler, FlaskConical, AlertCircle, ExternalLink, Link as LinkIcon, Tag, ArrowRight, RefreshCcw } from 'lucide-react';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';
import { useApp, parseInteractionSummary, getComputedDatesForCustomer } from '../contexts/AppContext';

interface CustomerProfileProps {
  customers: Customer[];
  samples: Sample[];
  onUpdateCustomer: (updated: Customer) => void;
}

const formatInteractionSummary = (isStarred: boolean, typeTag: string, effectTag: string, content: string) => {
  const starStr = isStarred ? '(标星记录)' : '(一般记录)';
  return `${starStr}<${typeTag}>{${effectTag}}${content}`;
};

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customers, samples, onUpdateCustomer }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, exhibitions, tagOptions, setCustomers, setSamples } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'samples'>(
    searchParams.get('tab') === 'samples' ? 'samples' : 'overview'
  );
  
  const [isEditSummaryOpen, setIsEditSummaryOpen] = useState(false);
  const [isEditContactsOpen, setIsEditContactsOpen] = useState(false);
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const [isEditUpcomingPlanOpen, setIsEditUpcomingPlanOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  
  // Interaction State
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [intIsStarred, setIntIsStarred] = useState(false);
  const [intTypeTag, setIntTypeTag] = useState('无');
  const [intEffectTag, setIntEffectTag] = useState('无');
  const [intContent, setIntContent] = useState('');
  
  const [showAllInteractions, setShowAllInteractions] = useState(false);
  const [tempSummary, setTempSummary] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempUpcomingPlan, setTempUpcomingPlan] = useState('');
  const [tempName, setTempName] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  const sortedCustomerSamples = useMemo(() => {
    return [...customerSamples].sort((a, b) => {
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [customerSamples]);

  useEffect(() => {
    if (editingInteraction) {
      const parsed = parseInteractionSummary(editingInteraction.summary);
      setIntIsStarred(parsed.isStarred);
      setIntTypeTag(parsed.typeTag);
      setIntEffectTag(parsed.effectTag);
      setIntContent(parsed.content);
    }
  }, [editingInteraction]);

  useEffect(() => {
    if (customer) {
      setTempName(customer.name);
    }
  }, [customer]);

  if (!customer) return <div className="p-8 text-center">Customer not found.</div>;

  const saveUpdate = (updatedFields: Partial<Customer>) => {
    onUpdateCustomer({ ...customer, ...updatedFields });
  };

  const handleUpdateSummary = () => {
    saveUpdate({ productSummary: tempSummary, lastStatusUpdate: format(new Date(), 'yyyy-MM-dd') });
    setIsEditSummaryOpen(false);
  };

  const handleUpdateTags = () => {
    saveUpdate({ tags: tempTags.filter(t => t.trim()) });
    setIsEditTagsOpen(false);
  };

  const handleUpdateUpcomingPlan = () => {
    saveUpdate({ upcomingPlan: tempUpcomingPlan });
    setIsEditUpcomingPlanOpen(false);
  };

  const handleUpdateName = () => {
    if (!tempName.trim()) return;
    if (confirm(t('confirmNameChange'))) {
      const oldName = customer.name;
      const newName = tempName.trim();
      
      // Update customer name
      saveUpdate({ name: newName });
      
      // Update name in samples globally
      setSamples(prev => prev.map(s => s.customerId === id ? { ...s, customerName: newName } : s));
      
      setIsEditNameModalOpen(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (confirm(t('confirmDeleteCustomer'))) {
      // Remove customer
      setCustomers(prev => prev.filter(c => c.id !== id));
      // Remove associated samples
      setSamples(prev => prev.filter(s => s.customerId !== id));
      // Redirect
      navigate('/customers');
    }
  };

  const handleRefreshDates = () => {
    setIsRefreshing(true);
    // Recalculate based on current interactions
    const computed = getComputedDatesForCustomer(customer.interactions);
    
    saveUpdate({
      lastContactDate: computed.lastContact || customer.lastContactDate,
      // Only update if computed value is found, otherwise keep original
      lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
      lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd')
    });

    // Brief delay for UX feedback
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const saveInteraction = (interactionToSave: Interaction) => {
    const isNew = !customer.interactions.some(i => i.id === interactionToSave.id);
    const finalSummary = formatInteractionSummary(intIsStarred, intTypeTag, intEffectTag, intContent);
    const updatedInt = { ...interactionToSave, summary: finalSummary };

    let newInteractions = isNew 
      ? [updatedInt, ...customer.interactions]
      : customer.interactions.map(i => i.id === updatedInt.id ? updatedInt : i);
    
    // Ensure chronological order for computation
    newInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Recalculate all computed dates based on the modified history
    const computed = getComputedDatesForCustomer(newInteractions);

    const updateObj: Partial<Customer> = { 
      interactions: newInteractions,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd'),
      lastContactDate: computed.lastContact || customer.lastContactDate,
      // Preserve existing if loop finds nothing
      lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
      lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate
    };

    saveUpdate(updateObj);
    setEditingInteraction(null);
  };

  const deleteInteraction = (intId: string) => {
    if (confirm(t('confirmDeleteInteraction'))) {
      const newInteractions = customer.interactions.filter(i => i.id !== intId);
      
      // Recalculate based on remaining history
      const computed = getComputedDatesForCustomer(newInteractions);

      const updateObj: Partial<Customer> = { 
        interactions: newInteractions,
        lastStatusUpdate: format(new Date(), 'yyyy-MM-dd'),
        lastContactDate: computed.lastContact || customer.lastContactDate,
        // Preserve existing if loop finds nothing
        lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
        lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate
      };

      saveUpdate(updateObj);
    }
  };

  const visibleInteractions = showAllInteractions ? customer.interactions : customer.interactions.slice(0, 3);
  const titleClass = "font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider";
  const contentTextClass = "text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight";

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
       <div className="flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
           <button onClick={() => navigate('/customers')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 active:scale-90">
             <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
           </button>
           <div className="flex-1">
             <div className="flex items-center gap-6">
               <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{customer.name}</h1>
               <div className="text-[1.2em]"><RankStars rank={customer.rank} editable onRankChange={(r) => saveUpdate({ rank: r })} /></div>
             </div>
             <div className="flex items-center gap-3 mt-3 text-slate-400 font-black uppercase text-xs tracking-widest">
               <MapPin className="w-4 h-4" /> <span>{customer.region.join(', ')}</span>
             </div>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => { setTempName(customer.name); setIsEditNameModalOpen(true); }} className="flex items-center gap-2">
             <PencilLine className="w-4 h-4" /> {t('edit')}
           </Button>
           <Button variant="danger" onClick={handleDeleteCustomer} className="flex items-center gap-2">
             <Trash2 className="w-4 h-4" /> {t('delete')}
           </Button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="p-5 border-l-4 border-l-blue-600 flex flex-col justify-between h-40 shadow-sm">
             <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('status')}</span>
             <div className="flex items-center gap-3 my-2">
                 <StatusIcon status={customer.followUpStatus} />
                 <span className="font-black text-xl xl:text-2xl text-slate-900 dark:text-white truncate tracking-tight uppercase">
                   {customer.followUpStatus}
                 </span>
             </div>
             <div className="flex gap-2.5 mt-auto">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(opt => (
                 <button 
                  key={opt} 
                  onClick={() => saveUpdate({ followUpStatus: opt as FollowUpStatus })} 
                  className={`w-4 h-4 xl:w-5 xl:h-5 rounded-full border-2 transition-all ${customer.followUpStatus === opt ? 'bg-blue-600 border-blue-200 scale-125' : 'bg-slate-100 border-transparent hover:bg-slate-200 dark:bg-slate-700'}`} 
                 />
               ))}
             </div>
          </Card>
          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" onDateChange={(d) => saveUpdate({ nextActionDate: d })} />
          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" onDateChange={(d) => saveUpdate({ lastStatusUpdate: d })} />
          <DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" onDateChange={(d) => saveUpdate({ lastCustomerReplyDate: d })} />
          <DaysCounter date={customer.lastMyReplyDate} label={t('unfollowedDays')} type="elapsed" onDateChange={(d) => saveUpdate({ lastMyReplyDate: d })} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
         <div className="space-y-8">
            <Card className="p-6 xl:p-8">
               <div className="flex justify-between items-center mb-6 pb-3 border-b">
                 <h3 className={titleClass}><UserCheck className="w-5 h-5 text-blue-600" /> {t('keyContacts')}</h3>
                 <button onClick={() => setIsEditContactsOpen(true)} className="p-2 rounded-lg bg-emerald-600 text-white"><PencilLine size={16}/></button>
               </div>
               <div className="space-y-4">
                 {customer.contacts.map((c, i) => (
                   <div key={i} className={`p-4 rounded-xl border-2 ${c.isPrimary ? 'border-blue-100 bg-blue-50/20' : 'border-slate-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-900 dark:text-white text-lg xl:text-xl">{c.name}</span>
                        {c.isPrimary && <Star size={16} className="fill-amber-400 text-amber-400" />}
                      </div>
                      <p className="text-sm font-black text-blue-600 uppercase mb-2">{c.title}</p>
                      <div className="text-sm space-y-1.5 text-slate-500 font-bold">
                        {c.email && <div className="flex items-center gap-2"><Mail size={14}/> {c.email}</div>}
                        {c.phone && <div className="flex items-center gap-2"><Phone size={14}/> {c.phone}</div>}
                      </div>
                   </div>
                 ))}
               </div>
            </Card>

            <Card className="p-6 xl:p-8">
               <div className="flex justify-between items-center mb-6 pb-3 border-b">
                 <h3 className={titleClass}><List className="w-5 h-5 text-indigo-600" /> {t('exhibitions')}</h3>
                 <button onClick={() => { setTempTags([...customer.tags]); setIsEditTagsOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white"><PencilLine size={16}/></button>
               </div>
               <div className="space-y-2">
                 {customer.tags.map((tag, i) => {
                   const matchedExhibition = exhibitions.find(e => e.name === tag);
                   return (
                    <div 
                      key={i} 
                      onClick={() => matchedExhibition && navigate(`/exhibitions/${matchedExhibition.id}`)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${matchedExhibition ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 hover:border-blue-300 hover:shadow-sm cursor-pointer group' : 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60'}`}
                    >
                       <span className={`text-sm xl:text-base font-black uppercase truncate flex-1 ${matchedExhibition ? 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600' : 'text-slate-400'}`}>
                         {tag}
                       </span>
                       {matchedExhibition && <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-all" />}
                    </div>
                   );
                 })}
                 {customer.tags.length === 0 && <div className="text-slate-400 italic text-sm">{t('noExhibitions')}</div>}
               </div>
            </Card>
         </div>

         <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border shadow-sm">
               <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 flex justify-between items-center border-b">
                  <h3 className="font-black text-base flex items-center gap-3 uppercase tracking-wider"><Box className="w-5 h-5 text-emerald-600"/> {t('productSummary')}</h3>
                  <button onClick={() => { setTempSummary(customer.productSummary); setIsEditSummaryOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white"><PencilLine size={20}/></button>
               </div>
               <div className="p-6">
                  <p className={contentTextClass}>{customer.productSummary || "No summary."}</p>
                  <div className="mt-6 pt-4 border-t flex justify-between items-center text-[10px] text-slate-400 font-black uppercase">
                     <span>{t('lastUpdated')}: {customer.lastStatusUpdate}</span>
                     <Badge color="green">{customer.status.toUpperCase()}</Badge>
                  </div>
               </div>
            </Card>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-wider ${activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-50'}`}>{t('overview')}</button>
              <button onClick={() => setActiveTab('samples')} className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-wider ${activeTab === 'samples' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-50'}`}>{t('samples')} ({customerSamples.length})</button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className={`p-8 rounded-[2rem] border-2 shadow-sm relative overflow-hidden ${getUrgencyLevel(customer.nextActionDate) === 'urgent' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                  <button onClick={() => { setTempUpcomingPlan(customer.upcomingPlan || ''); setIsEditUpcomingPlanOpen(true); }} className="absolute top-6 right-6 p-2 rounded-lg bg-emerald-600 text-white shadow-sm active:scale-95">
                    <PencilLine className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                     <Clock className="w-8 h-8 text-slate-800" />
                     <div>
                        <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">UPCOMING PLAN</h4>
                        <span className="text-lg xl:text-xl font-black text-slate-900 dark:text-white tracking-tight">DDL: {customer.nextActionDate || 'TBD'}</span>
                     </div>
                  </div>
                  <p className={contentTextClass}>{customer.upcomingPlan || "No plan logged."}</p>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h3 className={titleClass}><Calendar className="w-6 h-6 text-blue-600"/> {t('interactionHistory')}</h3>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={handleRefreshDates}
                          title="Refresh Unreplied / Unfollowed Dates"
                          className={`p-2.5 rounded-lg border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 bg-white dark:bg-slate-900 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                        >
                          <RefreshCcw size={18} />
                        </button>
                        <Button className="text-[10px] py-2 bg-blue-600 text-white rounded-lg px-6 font-black uppercase tracking-widest" 
                            onClick={() => {
                              setEditingInteraction({ id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '' });
                              setIntIsStarred(false);
                              setIntTypeTag('无');
                              setIntEffectTag('无');
                              setIntContent('');
                            }}>
                          <Plus size={14} className="mr-1" /> Log Progress
                        </Button>
                     </div>
                   </div>
                   
                   <div className="border-l-2 border-slate-200 ml-4 pl-8 py-4 space-y-8">
                     {customer.interactions.length > 0 ? (
                       <>
                         {visibleInteractions.map((int) => {
                           const parsed = parseInteractionSummary(int.summary);
                           return (
                            <div key={int.id} className="relative group">
                               <div className="absolute -left-[42px] top-1.5 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center font-black text-white text-[8px]"></div>
                               <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-sm text-slate-900 dark:text-white">{int.date}</span>
                                    <Star size={16} className={parsed.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                    {parsed.typeTag !== '无' && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{parsed.typeTag}</span>}
                                    {parsed.effectTag !== '无' && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{parsed.effectTag}</span>}
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => setEditingInteraction(int)} className="p-1.5 rounded-lg bg-emerald-600 text-white"><PencilLine size={14}/></button>
                                     <button onClick={() => deleteInteraction(int.id)} className="p-1.5 rounded-lg bg-red-600 text-white"><Trash2 size={14}/></button>
                                  </div>
                               </div>
                               <Card className="p-4 bg-white shadow-sm border border-slate-100">
                                  <p className="text-base xl:text-lg font-bold text-slate-800">{parsed.content}</p>
                                </Card>
                            </div>
                           );
                         })}
                         {customer.interactions.length > 3 && (
                           <div className="flex justify-center pt-2">
                             <button onClick={() => setShowAllInteractions(!showAllInteractions)} className="text-blue-600 font-black uppercase text-xs tracking-widest flex items-center gap-1">
                               {showAllInteractions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                               {showAllInteractions ? 'View Less' : `View More (${customer.interactions.length - 3})`}
                             </button>
                           </div>
                         )}
                       </>
                     ) : <div className="text-slate-400 italic">No history.</div>}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                 {sortedCustomerSamples.map(sample => (
                   <Card key={sample.id} className="p-6 hover:shadow-lg border-2 hover:border-blue-500 transition-all cursor-pointer" onClick={() => navigate(`/samples/${sample.id}`)}>
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-4 min-w-0">
                            <FlaskConical className="text-blue-600 w-8 h-8" />
                            <div className="truncate">
                               <h4 className="font-black text-lg text-slate-900 truncate">{sample.sampleName}</h4>
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SKU: {sample.sampleSKU || 'N/A'} | Qty: {sample.quantity}</div>
                            </div>
                         </div>
                         <div className="flex flex-col items-end shrink-0">
                            <Badge color="blue">{sample.status}</Badge>
                            <span className="text-[10px] font-black text-slate-400 uppercase mt-2">DDL: {sample.nextActionDate || 'TBD'}</span>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
            )}
         </div>
       </div>

       {/* --- Modals --- */}
       <Modal isOpen={isEditNameModalOpen} onClose={() => setIsEditNameModalOpen(false)} title={t('editCustomerName')}>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('contactName')}</label>
                <input 
                  className="w-full p-4 border-2 rounded-2xl font-black text-lg dark:bg-slate-800 outline-none focus:border-blue-500 transition-all" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  autoFocus
                />
             </div>
             <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsEditNameModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateName} className="bg-blue-600 px-8"><Save size={18} className="mr-1" /> Save Name</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditSummaryOpen} onClose={() => setIsEditSummaryOpen(false)} title={t('productSummary')}>
          <div className="space-y-4">
             <textarea className="w-full h-64 p-4 border-2 rounded-2xl outline-none font-bold text-lg" value={tempSummary} onChange={(e) => setTempSummary(e.target.value)} />
             <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsEditSummaryOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateSummary} className="px-8"><Save size={18} className="mr-1" /> Save Summary</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditUpcomingPlanOpen} onClose={() => setIsEditUpcomingPlanOpen(false)} title="Update Upcoming Plan">
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Details</label>
                <textarea className="w-full h-32 p-4 border-2 rounded-2xl outline-none font-bold" value={tempUpcomingPlan} onChange={(e) => setTempUpcomingPlan(e.target.value)} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                <input type="date" className="w-full p-4 border-2 rounded-xl font-black text-lg" value={customer.nextActionDate || ''} onChange={(e) => saveUpdate({ nextActionDate: e.target.value })} />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsEditUpcomingPlanOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateUpcomingPlan} className="px-8">Save Plan</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditContactsOpen} onClose={() => setIsEditContactsOpen(false)} title={t('keyContacts')}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
             {customer.contacts.map((contact, idx) => (
               <div key={idx} className="p-4 border-2 rounded-xl space-y-4 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact #{idx + 1}</span>
                    <button onClick={() => saveUpdate({ contacts: customer.contacts.filter((_, i) => i !== idx) })} className="text-red-500"><Trash2 size={16}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="p-2 border rounded-lg font-black text-sm" placeholder="Name" value={contact.name} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, name: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm" placeholder="Title" value={contact.title} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, title: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm" placeholder="Email" value={contact.email} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, email: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm" placeholder="Phone" value={contact.phone} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, phone: e.target.value} : c) })} />
                  </div>
                  <button onClick={() => saveUpdate({ contacts: customer.contacts.map((c, i) => ({...c, isPrimary: i === idx})) })} className={`text-xs font-black uppercase flex items-center gap-1 ${contact.isPrimary ? 'text-amber-500' : 'text-slate-400'}`}>
                    <Star size={12} fill={contact.isPrimary ? 'currentColor' : 'none'} /> Primary
                  </button>
               </div>
             ))}
             <button className="w-full py-4 border-2 border-dashed rounded-xl text-slate-400 font-black uppercase text-xs" onClick={() => saveUpdate({ contacts: [...customer.contacts, {name: '', title: '', isPrimary: false}] })}>
               + Add Contact
             </button>
          </div>
          <div className="mt-4 flex justify-end">
             <Button onClick={() => setIsEditContactsOpen(false)} className="px-8">Done</Button>
          </div>
       </Modal>

       {editingInteraction && (
         <Modal isOpen={true} onClose={() => setEditingInteraction(null)} title="Interaction Log">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <input type="date" className="w-full p-4 border-2 rounded-xl font-black" value={editingInteraction.date} onChange={(e) => setEditingInteraction({...editingInteraction, date: e.target.value})} />
                 </div>
                 <div className="flex items-center gap-3 pt-6">
                    <button 
                      onClick={() => setIntIsStarred(!intIsStarred)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-black text-xs uppercase transition-all ${intIsStarred ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-slate-100 text-slate-400'}`}
                    >
                      <Star size={18} fill={intIsStarred ? 'currentColor' : 'none'} />
                      {intIsStarred ? '标星记录' : '一般记录'}
                    </button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">对接流程类型 (Type)</label>
                     <select className="w-full p-4 border-2 rounded-xl font-bold bg-white dark:bg-slate-800 outline-none focus:border-blue-500" value={intTypeTag} onChange={e => setIntTypeTag(e.target.value)}>
                        {tagOptions.interactionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">流程作用标签 (Effect)</label>
                     <select className="w-full p-4 border-2 rounded-xl font-bold bg-white dark:bg-slate-800 outline-none focus:border-blue-500" value={intEffectTag} onChange={e => setIntEffectTag(e.target.value)}>
                        {tagOptions.interactionEffects.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Content</label>
                  <textarea className="w-full h-40 p-4 border-2 rounded-2xl font-bold outline-none focus:border-blue-500 dark:bg-slate-800" placeholder="Describe the interaction..." value={intContent} onChange={(e) => setIntContent(e.target.value)} />
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="secondary" onClick={() => setEditingInteraction(null)}>Cancel</Button>
                  <Button onClick={() => saveInteraction(editingInteraction)} className="bg-blue-600 px-8"><Save size={18} className="mr-2" /> Save Log</Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default CustomerProfile;