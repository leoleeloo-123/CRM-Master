
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank, Exhibition, SampleDocLink, TestStatus } from '../types';
import { Card, Badge, Button, RankStars, StatusIcon, DaysCounter, getUrgencyLevel, Modal, parseLocalDate } from '../components/Common';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star, PencilLine, ChevronDown, ChevronUp, Ruler, FlaskConical, AlertCircle, ExternalLink, Link as LinkIcon, Tag, ArrowRight, RefreshCcw, Check, Search, Filter } from 'lucide-react';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';
import { useApp, parseInteractionSummary, getComputedDatesForCustomer } from '../contexts/AppContext';
import { translateToZh } from '../utils/i18n';

interface CustomerProfileProps {
  customers: Customer[];
  samples: Sample[];
  onUpdateCustomer: (updated: Customer) => void;
}

const formatInteractionSummary = (isStarred: boolean, typeTag: string, exhibitionTag: string, effectTag: string, content: string) => {
  const starStr = isStarred ? '(标星记录)' : '(一般记录)';
  const exhStr = exhibitionTag && exhibitionTag !== 'None' ? `//${exhibitionTag}` : '';
  
  // Requirement: Ensure serialized tags in the summary string use Chinese if available for Excel consistency
  const typeZh = translateToZh(typeTag);
  const effectZh = translateToZh(effectTag);
  
  return `${starStr}<${typeZh}>${exhStr}{${effectZh}}${content}`;
};

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customers, samples, onUpdateCustomer }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, exhibitions, tagOptions, setCustomers, setSamples, language } = useApp();
  
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
  const [intTypeTag, setIntTypeTag] = useState('None');
  const [intExhibitionTag, setIntExhibitionTag] = useState('None'); // New State
  const [intEffectTag, setIntEffectTag] = useState('None');
  const [intContent, setIntContent] = useState('');
  
  // Filtering States for Interaction History
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterEffect, setFilterEffect] = useState('all');
  const [filterStarred, setFilterStarred] = useState('all'); // all, starred, normal

  // Filtering States for Samples Tab
  const [sampleStatusFilter, setSampleStatusFilter] = useState('all');
  const [sampleTestStatusFilter, setSampleTestStatusFilter] = useState('Ongoing');

  const [showAllInteractions, setShowAllInteractions] = useState(false);
  const [tempSummary, setTempSummary] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempUpcomingPlan, setTempUpcomingPlan] = useState('');
  const [tempName, setTempName] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Link Management State
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  const daysRemaining = useMemo(() => {
    if (!customer?.nextActionDate) return null;
    const targetDate = parseLocalDate(customer.nextActionDate);
    if (!isValid(targetDate)) return null;
    return differenceInDays(startOfDay(targetDate), startOfDay(new Date()));
  }, [customer?.nextActionDate]);

  const sortedCustomerSamples = useMemo(() => {
    return [...customerSamples].sort((a, b) => {
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [customerSamples]);

  // Derived filtered customer samples
  const filteredCustomerSamples = useMemo(() => {
    return sortedCustomerSamples.filter(s => {
      const matchesStatus = sampleStatusFilter === 'all' || s.status === sampleStatusFilter;
      const matchesTest = sampleTestStatusFilter === 'all' || s.testStatus === sampleTestStatusFilter;
      return matchesStatus && matchesTest;
    });
  }, [sortedCustomerSamples, sampleStatusFilter, sampleTestStatusFilter]);

  // Derived filtered interactions
  const processedInteractions = useMemo(() => {
    if (!customer) return [];
    return customer.interactions
      .map(int => ({
        ...int,
        parsed: parseInteractionSummary(int.summary)
      }))
      .filter(item => {
        const matchesType = filterType === 'all' || item.parsed.typeTag === filterType;
        const matchesEffect = filterEffect === 'all' || item.parsed.effectTag === filterEffect;
        const matchesStarred = filterStarred === 'all' || 
          (filterStarred === 'starred' && item.parsed.isStarred) || 
          (filterStarred === 'normal' && !item.parsed.isStarred);
        return matchesType && matchesEffect && matchesStarred;
      });
  }, [customer, filterType, filterEffect, filterStarred]);

  const visibleInteractions = showAllInteractions ? processedInteractions : processedInteractions.slice(0, 3);

  useEffect(() => {
    if (editingInteraction) {
      const parsed = parseInteractionSummary(editingInteraction.summary);
      setIntIsStarred(parsed.isStarred);
      setIntTypeTag(parsed.typeTag);
      setIntExhibitionTag(parsed.exhibitionTag || 'None');
      setIntEffectTag(parsed.effectTag);
      setIntContent(parsed.content);
    }
  }, [editingInteraction]);

  useEffect(() => {
    if (customer) {
      setTempName(customer.name);
    }
  }, [customer]);

  if (!customer) return <div className="p-8 text-center font-black uppercase text-slate-400">Customer not found.</div>;

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
    setTagSearchTerm('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (window.confirm(`${t('remove')} "${tagToRemove}"?`)) {
      setTempTags(prev => prev.filter(t => t !== tagToRemove));
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    if (!tempTags.includes(tagToAdd)) {
      setTempTags(prev => [...prev, tagToAdd]);
    }
    setTagSearchTerm('');
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
    const finalSummary = formatInteractionSummary(intIsStarred, intTypeTag, intExhibitionTag, intEffectTag, intContent);
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

  // Link Actions
  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !customer) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    const title = newLinkTitle.trim() || `Link ${ (customer.docLinks || []).length + 1 }`;
    const newLink: SampleDocLink = { title, url };
    const currentLinks = customer.docLinks || [];
    saveUpdate({ docLinks: [...currentLinks, newLink] });
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleDeleteLink = (index: number) => {
    if (!customer) return;
    if (confirm('Delete this link?')) {
      const updatedLinks = (customer.docLinks || []).filter((_, i) => i !== index);
      saveUpdate({ docLinks: updatedLinks });
    }
  };

  const handleStartEditLink = (index: number, link: SampleDocLink) => {
    setEditingLinkIndex(index);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
  };

  const handleSaveEditLink = () => {
    if (!customer || editingLinkIndex === null) return;
    let url = editLinkUrl.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    
    const updatedLinks = [...(customer.docLinks || [])];
    updatedLinks[editingLinkIndex] = { title: editLinkTitle.trim() || `Link ${editingLinkIndex + 1}`, url: url || '#' };
    saveUpdate({ docLinks: updatedLinks });
    setEditingLinkIndex(null);
  };

  const availableExhibitionsToAdd = useMemo(() => {
    return exhibitions
      .filter(ex => !tempTags.includes(ex.name))
      .filter(ex => ex.name.toLowerCase().includes(tagSearchTerm.toLowerCase()));
  }, [exhibitions, tempTags, tagSearchTerm]);

  // Unified Title Style for all cards
  const titleClass = "font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider";
  const contentTextClass = "text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight";
  const headerClass = "px-6 py-4 bg-slate-50 dark:bg-slate-800 flex justify-between items-center border-b border-slate-100 dark:border-slate-800";

  const resetFilters = () => {
    setFilterType('all');
    setFilterEffect('all');
    setFilterStarred('all');
  };

  const hasActiveFilters = filterType !== 'all' || filterEffect !== 'all' || filterStarred !== 'all';

  const urgency = getUrgencyLevel(customer.nextActionDate);

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
               <div className="text-[1.2em]">
                 <RankStars 
                   rank={customer.rank} 
                   editable 
                   onRankChange={(r) => {
                     if (window.confirm(t('confirmTierChange'))) {
                       saveUpdate({ rank: r });
                     }
                   }} 
                 />
               </div>
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
            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                 <h3 className={titleClass}><UserCheck className="w-5 h-5 text-blue-600" /> {t('keyContacts')}</h3>
                 <button onClick={() => setIsEditContactsOpen(true)} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"><PencilLine size={16}/></button>
               </div>
               <div className="p-6 space-y-4">
                 {customer.contacts.map((c, i) => (
                   <div key={i} className={`p-4 rounded-xl border-2 ${c.isPrimary ? 'border-blue-100 bg-blue-50/20' : 'border-slate-50 dark:border-slate-800'}`}>
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

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                 <h3 className={titleClass}><List className="w-5 h-5 text-indigo-600" /> {t('exhibitions')}</h3>
                 <button onClick={() => { setTempTags([...customer.tags]); setIsEditTagsOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"><PencilLine size={16}/></button>
               </div>
               <div className="p-6 space-y-2">
                 {customer.tags.map((tag, i) => {
                   const matchedExhibition = exhibitions.find(e => e.name === tag);
                   return (
                    <div 
                      key={i} 
                      onClick={() => matchedExhibition && navigate(`/exhibitions/${matchedExhibition.id}`)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${matchedExhibition ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-blue-300 hover:shadow-sm cursor-pointer group' : 'bg-slate-50/50 dark:bg-slate-900/20 border-transparent opacity-60'}`}
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

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                  <h3 className={titleClass}><LinkIcon className="w-5 h-5 text-blue-500" /> {t('fileLinks')}</h3>
               </div>
               <div className="p-6 space-y-4">
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <input 
                        className="w-full p-2.5 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs xl:text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500"
                        placeholder="Link Title (e.g. Contract)..."
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

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                     {(customer.docLinks || []).length > 0 ? (customer.docLinks || []).map((link, idx) => (
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
                                  <button onClick={() => handleDeleteLink(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
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
         </div>

         <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                  <h3 className={titleClass}><Clock className="w-5 h-5 text-blue-600"/> {t('upcomingPlanHeader')}</h3>
                  <button onClick={() => { setTempUpcomingPlan(customer.upcomingPlan || ''); setIsEditUpcomingPlanOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"><PencilLine size={20}/></button>
               </div>
               <div className="p-6">
                  <p className={contentTextClass}>{customer.upcomingPlan || "No plan logged."}</p>
                  <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase">
                     <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-black text-slate-900 dark:text-white">DDL: {customer.nextActionDate || 'TBD'}</span>
                        {daysRemaining !== null && (
                           <Badge color={urgency === 'urgent' ? 'red' : urgency === 'warning' ? 'yellow' : 'green'}>
                              {Math.abs(daysRemaining)} {daysRemaining < 0 ? (language === 'en' ? 'Days Overdue' : '天逾期') : (language === 'en' ? 'Days Remaining' : '天剩余')}
                           </Badge>
                        )}
                     </div>
                     <Badge color="blue">{t(customer.followUpStatus as any) || customer.followUpStatus}</Badge>
                  </div>
               </div>
            </Card>

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                  <h3 className={titleClass}><Box className="w-5 h-5 text-emerald-600"/> {t('productSummary')}</h3>
                  <button onClick={() => { setTempSummary(customer.productSummary); setIsEditSummaryOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"><PencilLine size={20}/></button>
               </div>
               <div className="p-6">
                  <p className={contentTextClass}>{customer.productSummary || "No summary."}</p>
                  <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase">
                     <span>{t('lastUpdated')}: {customer.lastStatusUpdate}</span>
                     <Badge color="green">{customer.status.toUpperCase()}</Badge>
                  </div>
               </div>
            </Card>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{t('overview')}</button>
              <button onClick={() => setActiveTab('samples')} className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'samples' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{t('samples')} ({customerSamples.length})</button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-6">
                   <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className={titleClass}><Calendar className="w-6 h-6 text-blue-600"/> {t('interactionHistory')}</h3>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => setShowFilters(!showFilters)}
                             className={`p-2.5 rounded-lg border-2 transition-all active:scale-90 ${showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-100'}`}
                           >
                             <Filter size={18} />
                           </button>
                           <button 
                             onClick={handleRefreshDates}
                             title="Refresh Unreplied / Unfollowed Dates"
                             className={`p-2.5 rounded-lg border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 bg-white dark:bg-slate-900 shadow-sm ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                           >
                             <RefreshCcw size={18} />
                           </button>
                           <Button className="text-[10px] py-2 bg-blue-600 text-white rounded-lg px-6 font-black uppercase tracking-widest shadow-lg shadow-blue-600/20" 
                               onClick={() => {
                                 setEditingInteraction({ id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '' });
                                 setIntIsStarred(false);
                                 setIntTypeTag('None');
                                 setIntExhibitionTag('None');
                                 setIntEffectTag('None');
                                 setIntContent('');
                               }}>
                             <Plus size={14} className="mr-1" /> Log Progress
                           </Button>
                        </div>
                      </div>

                      {showFilters && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex flex-wrap items-center gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t('availableTags')}</label>
                                 <select 
                                   className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
                                   value={filterStarred}
                                   onChange={e => setFilterStarred(e.target.value)}
                                 >
                                    <option value="all">记录: 全部</option>
                                    <option value="starred">⭐ {t('starredRecord')}</option>
                                    <option value="normal">⚪ {t('normalRecord')}</option>
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t('interactionType')}</label>
                                 <select 
                                   className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
                                   value={filterType}
                                   onChange={e => setFilterType(e.target.value)}
                                 >
                                    <option value="all">流程: 全部</option>
                                    {tagOptions.interactionTypes.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t('interactionEffect')}</label>
                                 <select 
                                   className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
                                   value={filterEffect}
                                   onChange={e => setFilterEffect(e.target.value)}
                                 >
                                    <option value="all">作用: 全部</option>
                                    {tagOptions.interactionEffects.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                                 </select>
                              </div>
                              {hasActiveFilters && (
                                <button onClick={resetFilters} className="mt-5 text-[10px] font-black uppercase text-rose-500 hover:underline">Reset</button>
                              )}
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-8 py-4 space-y-8">
                     {processedInteractions.length > 0 ? (
                       <>
                         {visibleInteractions.map((item) => {
                           const int = item;
                           const parsed = item.parsed;
                           return (
                            <div key={int.id} className="relative group">
                               <div className="absolute -left-[42px] top-1.5 w-5 h-5 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center font-black text-white text-[8px]"></div>
                               <div className="flex items-center justify-between mb-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-black text-sm text-slate-900 dark:text-white">{int.date}</span>
                                    <Star size={16} className={parsed.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} />
                                    {parsed.typeTag !== '无' && parsed.typeTag !== 'None' && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">{t(parsed.typeTag as any) || parsed.typeTag}</span>}
                                    {parsed.exhibitionTag !== '无' && parsed.exhibitionTag !== 'None' && <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">{parsed.exhibitionTag}</span>}
                                    {parsed.effectTag !== '无' && parsed.effectTag !== 'None' && <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">{t(parsed.effectTag as any) || parsed.effectTag}</span>}
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => setEditingInteraction(int)} className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-90"><PencilLine size={14}/></button>
                                     <button onClick={() => deleteInteraction(int.id)} className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all active:scale-90"><Trash2 size={14}/></button>
                                  </div>
                               </div>
                               <Card className="p-4 bg-white dark:bg-slate-800/40 shadow-sm border border-slate-100 dark:border-slate-800">
                                  <p className="text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{parsed.content}</p>
                                </Card>
                            </div>
                           );
                         })}
                         {processedInteractions.length > 3 && (
                           <div className="flex justify-center pt-2">
                             <button onClick={() => setShowAllInteractions(!showAllInteractions)} className="text-blue-600 font-black uppercase text-xs tracking-widest flex items-center gap-1">
                               {showAllInteractions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                               {showAllInteractions ? 'View Less' : `View More (${processedInteractions.length - 3})`}
                             </button>
                           </div>
                         )}
                       </>
                     ) : <div className="text-slate-400 italic font-bold py-10 text-center uppercase tracking-widest">No matching history found.</div>}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                 {/* Sample List Filters */}
                 <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Current Status</label>
                       <select 
                         className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500 shadow-sm"
                         value={sampleStatusFilter}
                         onChange={e => setSampleStatusFilter(e.target.value)}
                       >
                          <option value="all">全部Status</option>
                          {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any) || s}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Test Status</label>
                       <select 
                         className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500 shadow-sm"
                         value={sampleTestStatusFilter}
                         onChange={e => setSampleTestStatusFilter(e.target.value)}
                       >
                          <option value="all">Test: 全部</option>
                          <option value="Ongoing">样品测试中</option>
                          <option value="Finished">测试完成</option>
                          <option value="Terminated">项目终止</option>
                       </select>
                    </div>
                    { (sampleStatusFilter !== 'all' || sampleTestStatusFilter !== 'Ongoing') && (
                       <button onClick={() => { setSampleStatusFilter('all'); setSampleTestStatusFilter('Ongoing'); }} className="mt-5 text-[10px] font-black uppercase text-blue-600 hover:underline">Reset Filters</button>
                    )}
                    <div className="ml-auto mt-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       Showing {filteredCustomerSamples.length} Samples
                    </div>
                 </div>

                 <div className="space-y-2">
                    {filteredCustomerSamples.map(sample => (
                      <Card key={sample.id} className="p-3 xl:p-4 hover:shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer group" onClick={() => navigate(`/samples/${sample.id}`)}>
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                               <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                                  <FlaskConical className="w-5 h-5 xl:w-6 xl:h-6" />
                               </div>
                               <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-3">
                                     <h4 className="font-black text-sm xl:text-base text-slate-900 dark:text-white truncate uppercase tracking-tight">{sample.sampleName}</h4>
                                     <span className="hidden sm:inline bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border dark:border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                        SKU: {sample.sampleSKU || 'N/A'}
                                     </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mt-0.5">
                                     <div className="flex items-center gap-2">
                                        <Badge color={sample.testStatus === 'Finished' ? 'green' : sample.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                          <span className="text-[9px]">{t(sample.testStatus as any) || sample.testStatus}</span>
                                        </Badge>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                           Qty: {sample.quantity}
                                        </span>
                                     </div>
                                     
                                     <div className="hidden md:flex items-center gap-2">
                                        {(sample.docLinks || []).slice(0, 2).map((link, idx) => (
                                          <a 
                                            key={idx} 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50"
                                          >
                                            <LinkIcon size={8} /> {link.title}
                                          </a>
                                        ))}
                                        {(customer.docLinks || []).length > 2 && (
                                           <span className="text-[8px] font-black text-slate-400">...</span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-6 shrink-0">
                               <div className="text-right">
                                  <Badge color="blue">
                                     <span className="text-[10px]">{t(sample.status as any) || sample.status}</span>
                                  </Badge>
                                  <div className="text-[10px] font-black text-slate-400 uppercase mt-0.5 tracking-widest">
                                     DDL: <span className="text-slate-600 dark:text-slate-300">{sample.nextActionDate || 'TBD'}</span>
                                  </div>
                               </div>
                               <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                            </div>
                         </div>
                      </Card>
                    ))}
                    {filteredCustomerSamples.length === 0 && <div className="text-slate-400 italic font-bold py-16 text-center uppercase tracking-widest border-2 border-dashed rounded-3xl opacity-50">No samples matching filter.</div>}
                 </div>
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
                <Button variant="secondary" onClick={() => setIsEditNameModalOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleUpdateName} className="bg-blue-600 px-8"><Save size={18} className="mr-1" /> {t('save')}</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditSummaryOpen} onClose={() => setIsEditSummaryOpen(false)} title={t('productSummary')}>
          <div className="space-y-4">
             <textarea className="w-full h-64 p-4 border-2 rounded-2xl outline-none font-bold text-lg dark:bg-slate-800" value={tempSummary} onChange={(e) => setTempSummary(e.target.value)} />
             <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsEditSummaryOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleUpdateSummary} className="px-8"><Save size={18} className="mr-1" /> {t('save')}</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditTagsOpen} onClose={() => setIsEditTagsOpen(false)} title={t('exhibitions')}>
         <div className="space-y-6">
            <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('exhibitions')} Linked</h4>
               <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  {tempTags.length > 0 ? tempTags.map(tag => (
                    <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-tight">
                       {tag}
                       <button onClick={() => handleRemoveTag(tag)} className="p-0.5 hover:bg-rose-50 rounded-full transition-colors">
                          <Trash2 size={12} className="text-rose-500" />
                       </button>
                    </div>
                  )) : (
                    <span className="text-slate-400 italic text-xs font-bold uppercase tracking-widest">No Exhibitions Selected</span>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Exhibitions</h4>
               <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm font-bold dark:bg-slate-800 outline-none focus:border-blue-500"
                    placeholder="Search existing exhibitions..."
                    value={tagSearchTerm}
                    onChange={e => setTagSearchTerm(e.target.value)}
                  />
               </div>
               <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2">
                  {availableExhibitionsToAdd.length > 0 ? availableExhibitionsToAdd.map(ex => (
                    <div 
                      key={ex.id}
                      onClick={() => handleAddTag(ex.name)}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-xl hover:border-blue-200 cursor-pointer transition-all group"
                    >
                       <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight group-hover:text-blue-600">{ex.name}</span>
                       <Plus size={16} className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400 italic text-xs uppercase tracking-widest">No matching exhibitions found</div>
                  )}
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
               <Button variant="secondary" onClick={() => setIsEditTagsOpen(false)}>{t('cancel')}</Button>
               <Button onClick={handleUpdateTags} className="px-10 bg-blue-600">{t('save')}</Button>
            </div>
         </div>
       </Modal>

       <Modal isOpen={isEditUpcomingPlanOpen} onClose={() => setIsEditUpcomingPlanOpen(false)} title="Update Upcoming Plan">
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Details</label>
                <textarea className="w-full h-32 p-4 border-2 rounded-2xl outline-none font-bold dark:bg-slate-800" value={tempUpcomingPlan} onChange={(e) => setTempUpcomingPlan(e.target.value)} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                <input type="date" className="w-full p-4 border-2 rounded-xl font-black text-lg dark:bg-slate-800" value={customer.nextActionDate || ''} onChange={(e) => saveUpdate({ nextActionDate: e.target.value })} />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsEditUpcomingPlanOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleUpdateUpcomingPlan} className="px-8">{t('save')}</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditContactsOpen} onClose={() => setIsEditContactsOpen(false)} title={t('keyContacts')}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
             {customer.contacts.map((contact, idx) => (
               <div key={idx} className="p-4 border-2 rounded-xl space-y-4 bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact #{idx + 1}</span>
                    <button onClick={() => saveUpdate({ contacts: customer.contacts.filter((_, i) => i !== idx) })} className="text-red-500"><Trash2 size={16}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="p-2 border rounded-lg font-black text-sm dark:bg-slate-900" placeholder="Name" value={contact.name} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, name: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm dark:bg-slate-900" placeholder="Title" value={contact.title} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, title: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm dark:bg-slate-900" placeholder="Email" value={contact.email} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, email: e.target.value} : c) })} />
                    <input className="p-2 border rounded-lg font-bold text-sm dark:bg-slate-900" placeholder="Phone" value={contact.phone} onChange={(e) => saveUpdate({ contacts: customer.contacts.map((c, i) => i === idx ? {...c, phone: e.target.value} : c) })} />
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
         <Modal isOpen={true} onClose={() => setEditingInteraction(null)} title={t('interactionLog')}>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('dateLabel')}</label>
                    <input type="date" className="w-full p-4 border-2 rounded-xl font-black dark:bg-slate-800" value={editingInteraction.date} onChange={(e) => setEditingInteraction({...editingInteraction, date: e.target.value})} />
                 </div>
                 <div className="flex items-center gap-3 pt-6">
                    <button 
                      onClick={() => setIntIsStarred(!intIsStarred)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-black text-xs uppercase transition-all ${intIsStarred ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                    >
                      <Star size={18} fill={intIsStarred ? 'currentColor' : 'none'} />
                      {intIsStarred ? t('starredRecord') : t('normalRecord')}
                    </button>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('interactionType')} (TYPE)</label>
                     <select className="w-full p-4 border-2 rounded-xl font-bold bg-white dark:bg-slate-800 outline-none focus:border-blue-500" value={intTypeTag} onChange={e => setIntTypeTag(e.target.value)}>
                        {tagOptions.interactionTypes.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">关联展会 (EXHIBITION)</label>
                     <select className="w-full p-4 border-2 rounded-xl font-bold bg-white dark:bg-slate-800 outline-none focus:border-blue-500" value={intExhibitionTag} onChange={e => setIntExhibitionTag(e.target.value)}>
                        <option value="None">无 / None</option>
                        {customer.tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('interactionEffect')} (EFFECT)</label>
                  <select className="w-full p-4 border-2 rounded-xl font-bold bg-white dark:bg-slate-800 outline-none focus:border-blue-500" value={intEffectTag} onChange={e => setIntEffectTag(e.target.value)}>
                     {tagOptions.interactionEffects.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                  </select>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contentLabel')}</label>
                  <textarea className="w-full h-40 p-4 border-2 rounded-2xl font-bold outline-none focus:border-blue-500 dark:bg-slate-800" placeholder={t('describeInteraction')} value={intContent} onChange={(e) => setIntContent(e.target.value)} />
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                  <Button variant="secondary" onClick={() => setEditingInteraction(null)}>{t('cancel')}</Button>
                  <Button onClick={() => saveInteraction(editingInteraction)} className="bg-blue-600 px-8"><Save size={18} className="mr-2" /> {t('saveLog')}</Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default CustomerProfile;
