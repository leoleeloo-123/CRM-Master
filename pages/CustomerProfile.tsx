
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank, Exhibition, SampleDocLink, TestStatus } from '../types';
import { Card, Badge, Button, RankStars, StatusIcon, DaysCounter, getUrgencyLevel, Modal, parseLocalDate } from '../components/Common';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star, PencilLine, ChevronDown, ChevronUp, Ruler, FlaskConical, AlertCircle, ExternalLink, Link as LinkIcon, Tag, ArrowRight, RefreshCcw, Check, Search, Filter, CheckCircle2, Activity, ClipboardList, UserPlus, UserMinus, RotateCcw } from 'lucide-react';
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
  const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [intIsStarred, setIntIsStarred] = useState(false);
  const [intTypeTag, setIntTypeTag] = useState('None');
  const [intExhibitionTag, setIntExhibitionTag] = useState('None'); 
  const [intEffectTag, setIntEffectTag] = useState('None');
  const [intContent, setIntContent] = useState('');
  
  const [filterType, setFilterType] = useState('all');
  const [filterEffect, setFilterEffect] = useState('all');
  const [filterStarred, setFilterStarred] = useState('all');

  const [sampleStatusFilter, setSampleStatusFilter] = useState('all');
  const [sampleTestStatusFilter, setSampleTestStatusFilter] = useState('Ongoing');

  const [showAllInteractions, setShowAllInteractions] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false); 

  const [tempSummary, setTempSummary] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempUpcomingPlan, setTempUpcomingPlan] = useState('');
  const [tempDDL, setTempDDL] = useState('');
  const [tempStatus, setTempStatus] = useState<FollowUpStatus>('No Action');
  const [tempName, setTempName] = useState('');
  const [tempRegions, setTempRegions] = useState<string[]>([]);
  const [newRegionInput, setNewRegionInput] = useState('');
  const [editingRegionIndex, setEditingRegionIndex] = useState<number | null>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Contacts Management State
  const [tempContacts, setTempContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({ name: '', title: '', email: '', phone: '', isPrimary: false });
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  const urgency = getUrgencyLevel(customer?.nextActionDate);

  const daysRemaining = useMemo(() => {
    if (!customer?.nextActionDate) return null;
    const targetDate = parseLocalDate(customer.nextActionDate);
    if (!isValid(targetDate)) return null;
    return differenceInDays(startOfDay(targetDate), startOfDay(new Date()));
  }, [customer?.nextActionDate]);

  const visibleContacts = useMemo(() => {
    if (!customer) return [];
    return showAllContacts ? customer.contacts : customer.contacts.slice(0, 2);
  }, [customer, showAllContacts]);

  const sortedCustomerSamples = useMemo(() => {
    return [...customerSamples].sort((a, b) => {
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [customerSamples]);

  const filteredCustomerSamples = useMemo(() => {
    return sortedCustomerSamples.filter(s => {
      const matchesStatus = sampleStatusFilter === 'all' || s.status === sampleStatusFilter;
      const matchesTest = sampleTestStatusFilter === 'all' || s.testStatus === sampleTestStatusFilter;
      return matchesStatus && matchesTest;
    });
  }, [sortedCustomerSamples, sampleStatusFilter, sampleTestStatusFilter]);

  const availableExhibitionsToAdd = useMemo(() => {
    return exhibitions.filter(ex => 
      !tempTags.includes(ex.name) && 
      ex.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
    );
  }, [exhibitions, tempTags, tagSearchTerm]);

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
      setTempRegions(Array.isArray(customer.region) ? [...customer.region] : [customer.region]);
      setTempContacts([...customer.contacts]);
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
    saveUpdate({ 
      upcomingPlan: tempUpcomingPlan, 
      nextActionDate: tempDDL, 
      followUpStatus: tempStatus 
    });
    setIsEditUpcomingPlanOpen(false);
  };

  const handleUpdateCustomerInfo = () => {
    if (!tempName.trim()) return;
    const oldName = customer.name;
    const newName = tempName.trim();
    
    saveUpdate({ 
      name: newName,
      region: tempRegions.filter(r => r.trim())
    });
    
    if (oldName !== newName) {
      setSamples(prev => prev.map(s => s.customerId === id ? { ...s, customerName: newName } : s));
    }
    
    setIsEditCustomerModalOpen(false);
  };

  const handleDeleteCustomer = () => {
    if (confirm(t('confirmDeleteCustomer'))) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSamples(prev => prev.filter(s => s.customerId !== id));
      navigate('/customers');
    }
  };

  const handleRefreshDates = () => {
    setIsRefreshing(true);
    const computed = getComputedDatesForCustomer(customer.interactions);
    
    saveUpdate({
      lastContactDate: computed.lastContact || customer.lastContactDate,
      lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
      lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd')
    });

    setTimeout(() => setIsRefreshing(false), 600);
  };

  const saveInteraction = (interactionToSave: Interaction) => {
    const isNew = !customer.interactions.some(i => i.id === interactionToSave.id);
    const finalSummary = formatInteractionSummary(intIsStarred, intTypeTag, intExhibitionTag, intEffectTag, intContent);
    const updatedInt = { ...interactionToSave, summary: finalSummary };

    let newInteractions = isNew 
      ? [updatedInt, ...customer.interactions]
      : customer.interactions.map(i => i.id === updatedInt.id ? updatedInt : i);
    
    newInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const computed = getComputedDatesForCustomer(newInteractions);

    const updateObj: Partial<Customer> = { 
      interactions: newInteractions,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd'),
      lastContactDate: computed.lastContact || customer.lastContactDate,
      lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
      lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate
    };

    saveUpdate(updateObj);
    setEditingInteraction(null);
  };

  const deleteInteraction = (intId: string) => {
    if (confirm(t('confirmDeleteInteraction'))) {
      const newInteractions = customer.interactions.filter(i => i.id !== intId);
      const computed = getComputedDatesForCustomer(newInteractions);

      const updateObj: Partial<Customer> = { 
        interactions: newInteractions,
        lastStatusUpdate: format(new Date(), 'yyyy-MM-dd'),
        lastContactDate: computed.lastContact || customer.lastContactDate,
        lastCustomerReplyDate: computed.lastCustomerReply !== undefined ? computed.lastCustomerReply : customer.lastCustomerReplyDate,
        lastMyReplyDate: computed.lastMyReply !== undefined ? computed.lastMyReply : customer.lastMyReplyDate
      };

      saveUpdate(updateObj);
    }
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !customer) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    const title = newLinkTitle.trim() || `Link ${(customer.docLinks || []).length + 1}`;
    const newLink: SampleDocLink = { title, url };
    const currentLinks = customer.docLinks || [];
    saveUpdate({ docLinks: [...currentLinks, newLink] });
    setNewLinkUrl('');
    setNewLinkTitle('');
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

  const handleAddRegion = () => {
    if (!newRegionInput.trim()) return;
    setTempRegions([...tempRegions, newRegionInput.trim()]);
    setNewRegionInput('');
  };

  const handleRemoveRegion = (idx: number) => {
    setTempRegions(tempRegions.filter((_, i) => i !== idx));
  };

  // Contacts Logic
  const handleAddContact = () => {
    if (!newContact.name.trim()) return;
    
    if (editingContactIndex !== null) {
      // Update existing
      setTempContacts(prev => prev.map((c, i) => i === editingContactIndex ? { ...newContact } : c));
      setEditingContactIndex(null);
    } else {
      // Add new
      const isFirst = tempContacts.length === 0;
      const updated = [...tempContacts, { ...newContact, isPrimary: isFirst || newContact.isPrimary }];
      setTempContacts(updated);
    }
    
    // Clear form
    setNewContact({ name: '', title: '', email: '', phone: '', isPrimary: false });
  };

  const handleStartEditContact = (idx: number) => {
    setEditingContactIndex(idx);
    setNewContact({ ...tempContacts[idx] });
  };

  const handleCancelEditContact = () => {
    setEditingContactIndex(null);
    setNewContact({ name: '', title: '', email: '', phone: '', isPrimary: false });
  };

  const handleSetPrimaryContact = (index: number) => {
    // Modified to allow multiple primary contacts (toggles existing state)
    setTempContacts(prev => prev.map((c, i) => i === index ? { ...c, isPrimary: !c.isPrimary } : c));
  };

  const handleRemoveContact = (index: number) => {
    if (editingContactIndex === index) {
      handleCancelEditContact();
    }
    setTempContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateContacts = () => {
    saveUpdate({ contacts: tempContacts });
    setIsEditContactsOpen(false);
    setEditingContactIndex(null);
  };

  const titleClass = "font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider";
  const contentTextClass = "text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight";
  const headerClass = "px-6 py-4 bg-slate-100 dark:bg-slate-800/80 flex justify-between items-center border-b border-slate-200 dark:border-slate-700";
  const editBtnStyle = "p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 hover:shadow-sm transition-all active:scale-90 shadow-none";

  const resetFilters = () => {
    setFilterType('all');
    setFilterEffect('all');
    setFilterStarred('all');
  };

  const hasActiveFilters = filterType !== 'all' || filterEffect !== 'all' || filterStarred !== 'all';

  const MiniDaysCounter = ({ date, label, onDateChange }: { date?: string, label: string, onDateChange: (d: string) => void }) => {
    const targetDate = date ? parseLocalDate(date) : null;
    const daysDiff = targetDate && isValid(targetDate) ? differenceInDays(startOfDay(new Date()), startOfDay(targetDate)) : 0;
    
    let colorClass = "text-slate-700 dark:text-slate-200";
    if (targetDate && isValid(targetDate)) {
      const absDays = Math.abs(daysDiff);
      if (absDays < 7) colorClass = "text-emerald-500";
      else if (absDays <= 21) colorClass = "text-amber-500";
      else colorClass = "text-red-500";
    }

    return (
      <div className="flex flex-col items-center justify-center py-4 flex-1 border-r last:border-r-0 border-slate-100 dark:border-slate-800 relative group">
        <div className={`font-black text-2xl xl:text-3xl ${colorClass}`}>
          {!date ? '-' : Math.abs(daysDiff)}
        </div>
        <span className="text-[9px] xl:text-[10px] text-slate-400 font-black uppercase tracking-widest text-center mt-1">{label}</span>
        
        <input 
          type="date" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
          value={date || ''} 
          onChange={(e) => onDateChange(e.target.value)} 
        />
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
       <div className="flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
           <button onClick={() => navigate('/customers')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 active:scale-90">
             <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
           </button>
           <div className="flex-1">
             <div className="flex items-center gap-4 xl:gap-6">
               <h1 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{customer.name}</h1>
               <div className="text-[1.1em] xl:text-[1.2em] shrink-0">
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
               <MapPin className="w-4 h-4" /> <span>{Array.isArray(customer.region) ? customer.region.join(', ') : customer.region}</span>
             </div>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           <Button variant="secondary" onClick={() => { setIsEditCustomerModalOpen(true); }} className="flex items-center gap-2">
             <PencilLine className="w-4 h-4" /> {t('edit')}
           </Button>
           <Button variant="danger" onClick={handleDeleteCustomer} className="flex items-center gap-2">
             <Trash2 className="w-4 h-4" /> {t('delete')}
           </Button>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
         <div className="space-y-8">
            <Card className="overflow-hidden border shadow-sm flex flex-col">
               <div className={headerClass}>
                  <h3 className={titleClass}><Activity className="w-5 h-5 text-blue-600" /> {t('statusUpdateHeader')}</h3>
               </div>
               <div className="flex items-center bg-white dark:bg-slate-900/40">
                 <MiniDaysCounter 
                    date={customer.lastStatusUpdate} 
                    label={t('daysSinceUpdate')} 
                    onDateChange={(d) => saveUpdate({ lastStatusUpdate: d })} 
                 />
                 <MiniDaysCounter 
                    date={customer.lastCustomerReplyDate} 
                    label={t('unrepliedDays')} 
                    onDateChange={(d) => saveUpdate({ lastCustomerReplyDate: d })} 
                 />
                 <MiniDaysCounter 
                    date={customer.lastMyReplyDate} 
                    label={t('unfollowedDays')} 
                    onDateChange={(d) => saveUpdate({ lastMyReplyDate: d })} 
                 />
               </div>
            </Card>

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                 <h3 className={titleClass}><UserCheck className="w-5 h-5 text-blue-600" /> {t('keyContacts')}</h3>
                 <button onClick={() => setIsEditContactsOpen(true)} className={editBtnStyle}><PencilLine size={16}/></button>
               </div>
               <div className="p-6 space-y-4">
                 {visibleContacts.map((c, i) => (
                   <div key={i} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${c.isPrimary ? 'border-blue-100 bg-blue-50/20' : 'border-slate-50 dark:border-slate-800'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                           <span className="font-black text-slate-900 dark:text-white text-base xl:text-lg truncate">{c.name}</span>
                           {c.isPrimary && <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] xl:text-xs">
                             <span className="break-all">{c.email}</span>
                             <Mail size={12} className="text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] xl:text-xs font-black text-blue-600 uppercase truncate">{c.title}</p>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] xl:text-xs">
                            <span>{c.phone}</span>
                            <Phone size={12} className="text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
                 {customer.contacts.length > 2 && (
                   <div className="flex justify-center pt-2">
                     <button 
                       onClick={() => setShowAllContacts(!showAllContacts)} 
                       className="text-blue-600 font-black uppercase text-[10px] xl:text-xs tracking-widest flex items-center gap-1 hover:underline transition-all active:scale-95"
                     >
                       {showAllContacts ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                       {showAllContacts ? 'View Less' : `View More (${customer.contacts.length - 2})`}
                     </button>
                   </div>
                 )}
               </div>
            </Card>

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                  <h3 className={titleClass}><Box className="w-5 h-5 text-blue-600"/> {t('productSummary')}</h3>
                  <button onClick={() => { setTempSummary(customer.productSummary); setIsEditSummaryOpen(true); }} className={editBtnStyle}><PencilLine size={16}/></button>
               </div>
               <div className="p-6">
                  <div className={contentTextClass + " whitespace-pre-wrap"}>{customer.productSummary || "No summary."}</div>
               </div>
            </Card>

            <Card className="overflow-hidden border shadow-sm">
               <div className={headerClass}>
                 <h3 className={titleClass}><List className="w-5 h-5 text-blue-600" /> {t('exhibitions').toUpperCase()}</h3>
                 <button onClick={() => { setTempTags([...customer.tags]); setIsEditTagsOpen(true); }} className={editBtnStyle}><PencilLine size={16}/></button>
               </div>
               <div className="p-6">
                 <div className="flex flex-wrap gap-2">
                   {customer.tags.map((tag, i) => {
                     const matchedExhibition = exhibitions.find(e => e.name === tag);
                     return (
                      <button 
                        key={i} 
                        onClick={() => matchedExhibition && navigate(`/exhibitions/${matchedExhibition.id}`)}
                        className={`px-4 py-2 rounded-full border text-[10px] xl:text-xs font-black uppercase transition-all flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer shadow-sm`}
                      >
                         <span>{tag}</span>
                         <ArrowRight size={10} className="opacity-40" />
                      </button>
                     );
                   })}
                 </div>
                 {customer.tags.length === 0 && <div className="text-slate-400 italic text-[10px] font-black uppercase tracking-widest">{t('noExhibitions')}</div>}
               </div>
            </Card>

            <Card className="overflow-hidden border shadow-sm flex flex-col">
               <div className={headerClass}>
                  <h3 className={titleClass}><LinkIcon className="w-5 h-5 text-blue-600" /> {t('docLinks').toUpperCase()}</h3>
                  <button onClick={() => setIsEditLinksOpen(true)} className={editBtnStyle}><PencilLine size={16}/></button>
               </div>
               <div className={`p-6 ${(!customer.docLinks || customer.docLinks.length === 0) ? 'py-4' : ''}`}>
                  <div className="flex flex-wrap gap-3">
                     {(customer.docLinks || []).length > 0 ? (customer.docLinks || []).map((link, idx) => (
                       <a 
                          key={idx}
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-5 py-3 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-black text-xs xl:text-sm flex items-center gap-2 hover:border-blue-300 transition-all shadow-sm"
                       >
                          <ExternalLink size={14} className="shrink-0" />
                          <span className="whitespace-nowrap">{link.title}</span>
                       </a>
                     )) : (
                       <div className="w-full text-center py-2 text-slate-300 italic text-xs xl:text-sm border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-2xl">
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
                  <button onClick={() => { 
                    setTempUpcomingPlan(customer.upcomingPlan || ''); 
                    setTempDDL(customer.nextActionDate || '');
                    setTempStatus(customer.followUpStatus || 'No Action');
                    setIsEditUpcomingPlanOpen(true); 
                  }} className={editBtnStyle}><PencilLine size={20}/></button>
               </div>
               <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                     <div className={contentTextClass + " flex-1 whitespace-pre-wrap"}>{customer.upcomingPlan || "No plan logged."}</div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase">
                     <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-black text-slate-900 dark:text-white text-xs xl:text-sm">DDL: {customer.nextActionDate || 'TBD'}</span>
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

            <Card className="overflow-hidden border shadow-sm flex flex-col mt-4">
              <div className="px-4 pt-4 bg-slate-100 dark:bg-slate-800 flex gap-1 border-b border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`transition-all px-10 py-5 rounded-t-3xl font-black text-lg xl:text-xl uppercase tracking-wider flex items-center gap-3 relative ${
                    activeTab === 'overview' 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)] z-10 -mb-[2px]' 
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  <ClipboardList className={`w-6 h-6 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400 opacity-60'}`} />
                  <span>{t('interactionHistory')}</span>
                </button>

                <button 
                  onClick={() => setActiveTab('samples')} 
                  className={`transition-all px-10 py-5 rounded-t-3xl font-black text-lg xl:text-xl uppercase tracking-wider flex items-center gap-3 relative ${
                    activeTab === 'samples' 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)] z-10 -mb-[2px]' 
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  <FlaskConical className={`w-6 h-6 ${activeTab === 'samples' ? 'text-blue-600' : 'text-slate-400 opacity-60'}`} />
                  <span>{t('sampleSummary')}</span>
                </button>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900">
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-6">
                       <div className="flex flex-col gap-4">
                          <Card className="p-6 border border-slate-100 dark:border-slate-800 flex items-center bg-slate-50/50 dark:bg-slate-800/40 shadow-sm rounded-2xl">
                             <div className="flex flex-wrap items-center gap-6 w-full">
                                <select 
                                  className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm min-w-[160px]"
                                  value={filterStarred}
                                  onChange={e => setFilterStarred(e.target.value)}
                                >
                                   <option value="all">记录: 全部</option>
                                   <option value="starred">⭐ {t('starredRecord')}</option>
                                   <option value="normal">⚪ {t('normalRecord')}</option>
                                </select>
                                
                                <select 
                                  className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm min-w-[160px]"
                                  value={filterType}
                                  onChange={e => setFilterType(e.target.value)}
                                >
                                   <option value="all">流程: 全部</option>
                                   {tagOptions.interactionTypes.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                                 </select>
                                
                                <select 
                                  className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm min-w-[160px]"
                                  value={filterEffect}
                                  onChange={e => setFilterEffect(e.target.value)}
                                >
                                   <option value="all">作用: 全部</option>
                                   {tagOptions.interactionEffects.map(tOption => <option key={tOption} value={tOption}>{t(tOption as any) || tOption}</option>)}
                                </select>
                                
                                {hasActiveFilters && (
                                  <button onClick={resetFilters} className="text-sm font-black uppercase text-rose-500 hover:underline">Reset</button>
                                )}

                                <div className="ml-auto flex items-center gap-3 self-end">
                                   <button 
                                     onClick={handleRefreshDates}
                                     title="Refresh Unreplied / Unfollowed Dates"
                                     className={`p-2.5 rounded-lg border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 bg-white dark:bg-slate-900 shadow-sm ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                                   >
                                     <RefreshCcw size={18} />
                                   </button>
                                   <Button className="text-[10px] py-3 bg-blue-600 text-white rounded-xl px-8 font-black uppercase tracking-widest shadow-lg shadow-blue-600/20" 
                                       onClick={() => {
                                         setEditingInteraction({ id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '' });
                                         setIntIsStarred(false);
                                         setIntTypeTag('None');
                                         setIntExhibitionTag('None');
                                         setIntEffectTag('None');
                                         setIntContent('');
                                       }}>
                                     <Plus size={16} className="mr-1" /> Log Progress
                                   </Button>
                                </div>
                             </div>
                          </Card>
                       </div>
                       
                       <div className="border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-10 py-4 space-y-10">
                         {processedInteractions.length > 0 ? (
                           <>
                             {visibleInteractions.map((item) => {
                               const int = item;
                               const parsed = item.parsed;
                               return (
                                <div key={int.id} className="relative group">
                                   <div className="absolute -left-[51px] top-1.5 w-5 h-5 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center font-black text-white text-[8px]"></div>
                                   <div className="flex items-center justify-between mb-3">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-black text-sm text-slate-900 dark:text-white">{int.date}</span>
                                        <Star size={16} className={parsed.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} />
                                        {parsed.typeTag !== '无' && parsed.typeTag !== 'None' && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-blue-100 dark:border-blue-800">{t(parsed.typeTag as any) || parsed.typeTag}</span>}
                                        {parsed.exhibitionTag !== '无' && parsed.exhibitionTag !== 'None' && <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-purple-100 dark:border-purple-800">{parsed.exhibitionTag}</span>}
                                        {parsed.effectTag !== '无' && parsed.effectTag !== 'None' && <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-emerald-100 dark:border-emerald-800">{t(parsed.effectTag as any) || parsed.effectTag}</span>}
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={() => setEditingInteraction(int)} className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-90"><PencilLine size={14}/></button>
                                         <button onClick={() => deleteInteraction(int.id)} className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all active:scale-90"><Trash2 size={14}/></button>
                                      </div>
                                   </div>
                                   <Card className="p-6 bg-slate-50/30 dark:bg-slate-800/40 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl">
                                      <p className="text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{parsed.content}</p>
                                    </Card>
                                </div>
                               );
                             })}
                             {processedInteractions.length > 3 && (
                               <div className="flex justify-center pt-2">
                                 <button onClick={() => setShowAllInteractions(!showAllInteractions)} className="text-blue-600 font-black uppercase text-xs tracking-widest flex items-center gap-1 hover:underline transition-all">
                                   {showAllInteractions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                   {showAllInteractions ? 'View Less' : `View More (${processedInteractions.length - 3})`}
                                 </button>
                               </div>
                             )}
                           </>
                         ) : <div className="text-slate-400 italic font-bold py-16 text-center uppercase tracking-widest border-2 border-dashed rounded-3xl">No matching history found.</div>}
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'samples' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                     <Card className="p-6 border border-slate-100 dark:border-slate-800 flex items-center bg-slate-50/50 dark:bg-slate-800/40 shadow-sm rounded-2xl">
                        <div className="flex flex-wrap items-center gap-6 w-full">
                           <select 
                             className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm min-w-[160px]"
                             value={sampleStatusFilter}
                             onChange={e => setSampleStatusFilter(e.target.value)}
                           >
                              <option value="all">全部Status</option>
                              {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any) || s}</option>)}
                           </select>
                           
                           <select 
                             className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 shadow-sm min-w-[160px]"
                             value={sampleTestStatusFilter}
                             onChange={e => setSampleTestStatusFilter(e.target.value)}
                           >
                              <option value="all">Test: 全部</option>
                              <option value="Ongoing">样品测试中</option>
                              <option value="Finished">测试完成</option>
                              <option value="Terminated">项目终止</option>
                           </select>
                           
                           { (sampleStatusFilter !== 'all' || sampleTestStatusFilter !== 'Ongoing') && (
                              <button onClick={() => { setSampleStatusFilter('all'); setSampleTestStatusFilter('Ongoing'); }} className="text-sm font-black uppercase text-blue-600 hover:underline">Reset Filters</button>
                           )}
                           <div className="ml-auto text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              {language === 'en' 
                                ? `Showing ${filteredCustomerSamples.length} Samples | ${customerSamples.length} Samples in Total`
                                : `显示 ${filteredCustomerSamples.length} 个样品 | 共 ${customerSamples.length} 个样品`}
                           </div>
                        </div>
                     </Card>

                     <div className="space-y-3">
                        {filteredCustomerSamples.map(sample => (
                          <Card key={sample.id} className="p-5 xl:p-6 hover:shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all cursor-pointer group rounded-3xl" onClick={() => navigate(`/samples/${sample.id}`)}>
                             <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-6 min-w-0 flex-1">
                                   <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                                      <FlaskConical className="w-6 h-6 xl:w-8 xl:h-8" />
                                   </div>
                                   <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-4">
                                         <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{sample.sampleIndex}</span>
                                            {sample.isStarredSample && <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />}
                                         </div>
                                         <h4 className="font-black text-base xl:text-lg text-slate-900 dark:text-white truncate uppercase tracking-tight">{sample.sampleName}</h4>
                                         <span className="hidden sm:inline bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            SKU: {sample.sampleSKU || 'N/A'}
                                         </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-6 mt-1.5">
                                         <div className="flex items-center gap-3">
                                            <Badge color={sample.testStatus === 'Finished' ? 'green' : sample.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                              <span className="text-[10px]">{t(sample.testStatus as any) || sample.testStatus}</span>
                                            </Badge>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                               Qty: {sample.quantity}
                                            </span>
                                         </div>
                                         
                                         <div className="hidden md:flex items-center gap-3">
                                            {(sample.docLinks || []).slice(0, 3).map((link, idx) => (
                                              <a 
                                                key={idx} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/50 dark:bg-blue-900/20 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900/50"
                                              >
                                                <LinkIcon size={10} /> {link.title}
                                              </a>
                                            ))}
                                            {(customer.docLinks || []).length > 3 && (
                                               <span className="text-[10px] font-black text-slate-400">...</span>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                
                                <div className="flex items-center gap-8 shrink-0">
                                   <div className="text-right">
                                      <div className="mb-1"><Badge color="blue"><span className="text-xs font-black">{t(sample.status as any) || sample.status}</span></Badge></div>
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                         DDL: <span className="text-slate-700 dark:text-slate-300">{sample.nextActionDate || 'TBD'}</span>
                                      </div>
                                   </div>
                                   <ArrowRight size={24} className="text-slate-200 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                                </div>
                             </div>
                          </Card>
                        ))}
                        {filteredCustomerSamples.length === 0 && <div className="text-slate-400 italic font-bold py-24 text-center uppercase tracking-widest border-2 border-dashed rounded-[3rem] opacity-50">No samples matching filter.</div>}
                     </div>
                  </div>
                )}
              </div>
            </Card>
         </div>
       </div>

       {/* Key Contacts Management Modal */}
       <Modal isOpen={isEditContactsOpen} onClose={() => { setIsEditContactsOpen(false); setEditingContactIndex(null); }} title={t('keyContacts')}>
          <div className="space-y-8">
             {/* Add/Edit Contact Form */}
             <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-800 space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">
                   {editingContactIndex !== null ? (
                      <><PencilLine size={16} className="text-amber-500" /> EDIT CONTACT</>
                   ) : (
                      <><UserPlus size={16} className="text-blue-500" /> {t('addContact')}</>
                   )}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactName')} *</label>
                      <input 
                         className="w-full p-3 border-2 border-white dark:border-slate-900 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                         value={newContact.name}
                         onChange={e => setNewContact({...newContact, name: e.target.value})}
                         placeholder="Contact Name"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactTitle')}</label>
                      <input 
                         className="w-full p-3 border-2 border-white dark:border-slate-900 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                         value={newContact.title}
                         onChange={e => setNewContact({...newContact, title: e.target.value})}
                         placeholder="e.g. CEO"
                      />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactEmail')}</label>
                      <input 
                         className="w-full p-3 border-2 border-white dark:border-slate-900 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                         value={newContact.email}
                         onChange={e => setNewContact({...newContact, email: e.target.value})}
                         placeholder="example@company.com"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactPhone')}</label>
                      <input 
                         className="w-full p-3 border-2 border-white dark:border-slate-900 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
                         value={newContact.phone}
                         onChange={e => setNewContact({...newContact, phone: e.target.value})}
                         placeholder="+123..."
                      />
                   </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <div className="relative">
                            <input 
                               type="checkbox" 
                               className="sr-only" 
                               checked={newContact.isPrimary} 
                               onChange={e => setNewContact({...newContact, isPrimary: e.target.checked})} 
                            />
                            <div className={`w-10 h-6 rounded-full transition-colors ${newContact.isPrimary ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newContact.isPrimary ? 'translate-x-4' : ''}`}></div>
                         </div>
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">{t('primaryContact')}</span>
                      </label>
                   </div>
                   <div className="flex gap-2">
                      {editingContactIndex !== null && (
                         <button 
                           onClick={handleCancelEditContact}
                           className="p-2.5 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 rounded-xl"
                           title="Cancel Edit"
                         >
                            <RotateCcw size={18} />
                         </button>
                      )}
                      <button 
                        onClick={handleAddContact}
                        className={`px-10 py-2.5 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all ${editingContactIndex !== null ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                         {editingContactIndex !== null ? 'Update' : t('add')}
                      </button>
                   </div>
                </div>
             </div>

             {/* Existing Contacts List */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Manage Contacts ({tempContacts.length})</h4>
                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1 scrollbar-hide">
                   {tempContacts.length > 0 ? tempContacts.map((contact, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border-2 flex items-center justify-between group transition-all ${contact.isPrimary ? 'border-blue-100 bg-blue-50/10' : 'border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900'} ${editingContactIndex === idx ? 'ring-2 ring-amber-400 border-amber-200' : ''}`}>
                         <div className="flex items-center gap-5">
                            <button 
                               onClick={() => handleSetPrimaryContact(idx)}
                               className={`p-2 rounded-xl transition-all ${contact.isPrimary ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                               title="Toggle Primary Status"
                            >
                               <Star size={18} fill={contact.isPrimary ? 'currentColor' : 'none'} />
                            </button>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-900 dark:text-white uppercase leading-none">{contact.name}</span>
                                  {contact.isPrimary && <Badge color="yellow">PRIMARY</Badge>}
                               </div>
                               <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">{contact.title || 'No Title'}</p>
                               <div className="flex items-center gap-3 mt-1 opacity-60">
                                  {contact.email && <span className="text-[10px] font-bold flex items-center gap-1"><Mail size={10}/> {contact.email}</span>}
                                  {contact.phone && <span className="text-[10px] font-bold flex items-center gap-1"><Phone size={10}/> {contact.phone}</span>}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                               onClick={() => handleStartEditContact(idx)}
                               className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
                               title="Edit Information"
                            >
                               <PencilLine size={18} />
                            </button>
                            <button 
                               onClick={() => handleRemoveContact(idx)}
                               className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                               title="Remove Contact"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>
                   )) : (
                     <div className="text-center py-12 border-2 border-dashed rounded-3xl opacity-30">
                        <UserMinus size={32} className="mx-auto mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest">No Contacts Listed</span>
                     </div>
                   )}
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
                <Button variant="secondary" onClick={() => { setIsEditContactsOpen(false); setEditingContactIndex(null); }}>{t('cancel')}</Button>
                <Button onClick={handleUpdateContacts} className="bg-blue-600 px-12 shadow-xl shadow-blue-600/20 font-black uppercase text-sm tracking-widest">Save Contacts</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditCustomerModalOpen} onClose={() => setIsEditCustomerModalOpen(false)} title={t('editCustomerName')}>
          <div className="space-y-8">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('contactName')}</label>
                <input 
                  className="w-full p-4 border-2 rounded-2xl font-black text-lg dark:bg-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)} 
                  autoFocus
                />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <MapPin size={14} /> Region / Locations (地点管理)
                </label>
                
                <div className="space-y-3">
                   {tempRegions.map((region, idx) => (
                      <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                         {editingRegionIndex === idx ? (
                            <div className="flex-1 flex gap-2">
                               <input 
                                 className="flex-1 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-xl font-bold bg-white dark:bg-slate-900 outline-none shadow-inner"
                                 defaultValue={region}
                                 autoFocus
                                 onBlur={(e) => {
                                    const next = [...tempRegions];
                                    next[idx] = e.target.value.trim();
                                    setTempRegions(next.filter(r => r));
                                    setEditingRegionIndex(null);
                                 }}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                       const next = [...tempRegions];
                                       next[idx] = (e.target as HTMLInputElement).value.trim();
                                       setTempRegions(next.filter(r => r));
                                       setEditingRegionIndex(null);
                                    }
                                 }}
                               />
                               <button className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm"><Check size={20}/></button>
                            </div>
                         ) : (
                            <div className="flex-1 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl group">
                               <span className="font-bold text-slate-800 dark:text-slate-200 px-2">{region}</span>
                               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingRegionIndex(idx)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><PencilLine size={16}/></button>
                                  <button onClick={() => handleRemoveRegion(idx)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                               </div>
                            </div>
                         )}
                      </div>
                   ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                   <input 
                      className="flex-1 p-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-all shadow-inner"
                      placeholder="Add new location..."
                      value={newRegionInput}
                      onChange={(e) => setNewRegionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRegion()}
                   />
                   <button onClick={handleAddRegion} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-90">
                      <Plus size={20} />
                   </button>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsEditCustomerModalOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleUpdateCustomerInfo} className="bg-blue-600 px-8 shadow-xl shadow-blue-600/20"><Save size={18} className="mr-2" /> {t('save')}</Button>
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
               <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-100 dark:border-slate-700">
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

       <Modal isOpen={isEditUpcomingPlanOpen} onClose={() => setIsEditUpcomingPlanOpen(false)} title="UPDATE UPCOMING PLAN">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status / 跟进状态</label>
                <div className="flex gap-2">
                  {[
                    { id: 'My Turn', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
                    { id: 'Waiting for Customer', icon: <Clock className="w-4 h-4 text-amber-500" /> },
                    { id: 'No Action', icon: <div className="w-2 h-2 rounded-full bg-slate-300" /> }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setTempStatus(opt.id as FollowUpStatus)}
                      className={`flex-1 py-3 px-2 rounded-xl border-2 font-black text-[10px] xl:text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                        tempStatus === opt.id 
                          ? 'border-blue-600 text-blue-700 bg-white shadow-md' 
                          : 'border-slate-100 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {opt.icon}
                      {t(opt.id as any) || opt.id}
                    </button>
                  ))}
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan Details / 详细计划</label>
                <textarea 
                  className="w-full h-40 p-4 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm xl:text-base dark:bg-slate-800 focus:border-blue-500 transition-all shadow-inner" 
                  value={tempUpcomingPlan} 
                  onChange={(e) => setTempUpcomingPlan(e.target.value)} 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date / 关键日期 (DDL)</label>
                <input 
                  type="date" 
                  className="w-full p-4 border-2 border-slate-100 rounded-xl font-black text-base xl:text-lg dark:bg-slate-800 focus:border-blue-500 outline-none transition-all shadow-inner" 
                  value={tempDDL} 
                  onChange={(e) => setTempDDL(e.target.value)} 
                />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsEditUpcomingPlanOpen(false)} className="px-8 border-2">{t('cancel')}</Button>
                <Button onClick={handleUpdateUpcomingPlan} className="px-10 bg-blue-600 shadow-lg shadow-blue-600/20">{t('save')}</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditLinksOpen} onClose={() => setIsEditLinksOpen(false)} title={t('fileLinks')}>
          <div className="space-y-8">
             <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addFileLink')}</h4>
                <div className="space-y-3">
                   <input 
                      className="w-full p-3 border-2 border-white dark:border-slate-800 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                      placeholder="Link Title (e.g. Contract)..."
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                   />
                   <div className="flex gap-2">
                      <input 
                         className="flex-1 p-3 border-2 border-white dark:border-slate-800 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                         placeholder="Paste URL here..."
                         value={newLinkUrl}
                         onChange={(e) => setNewLinkUrl(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                      />
                      <button onClick={handleAddLink} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-90">
                         <Plus size={20} />
                      </button>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manage Existing Links</h4>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                   {(customer.docLinks || []).length > 0 ? (customer.docLinks || []).map((link, idx) => (
                     <div key={idx}>
                        {editingLinkIndex === idx ? (
                          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border-2 border-blue-200 dark:border-blue-800 space-y-3 shadow-md">
                             <input 
                                className="w-full p-3 border-2 border-white dark:border-slate-800 rounded-xl text-sm font-bold bg-white dark:bg-slate-900"
                                value={editLinkTitle}
                                onChange={e => setEditLinkTitle(e.target.value)}
                                placeholder="Title"
                             />
                             <input 
                                className="w-full p-3 border-2 border-white dark:border-slate-800 rounded-xl text-sm font-bold bg-white dark:bg-slate-900"
                                value={editLinkUrl}
                                onChange={e => setEditLinkUrl(e.target.value)}
                                placeholder="URL"
                             />
                             <div className="flex gap-3 pt-1">
                                <button onClick={() => setEditingLinkIndex(null)} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black uppercase text-slate-500">Cancel</button>
                                <button onClick={handleSaveEditLink} className="flex-1 p-3 bg-blue-600 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-2"><Check size={14}/> Save</button>
                             </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 group shadow-sm hover:border-blue-200 transition-colors">
                             <div className="flex items-center gap-3 truncate flex-1 pr-4">
                                <LinkIcon size={16} className="text-slate-300" />
                                <div className="flex flex-col truncate">
                                   <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{link.title}</span>
                                   <span className="text-[10px] font-bold text-slate-400 truncate">{link.url}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => { setEditingLinkIndex(idx); setEditLinkTitle(link.title); setEditLinkUrl(link.url); }} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                                   <PencilLine size={16} />
                                </button>
                                <button onClick={() => { if(confirm('Delete?')) { const updated = (customer.docLinks || []).filter((_, i) => i !== idx); saveUpdate({ docLinks: updated }); } }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </div>
                        )}
                     </div>
                   )) : (
                     <div className="text-center py-12 text-slate-300 italic text-sm font-black uppercase tracking-widest border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        No links added yet.
                     </div>
                   )}
                </div>
             </div>

             <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                <Button onClick={() => setIsEditLinksOpen(false)} className="px-12 bg-slate-900 text-white">Done</Button>
             </div>
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
