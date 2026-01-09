
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank, Exhibition } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter, getUrgencyLevel, Modal, parseLocalDate } from '../components/Common';
import { ArrowLeft, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star, PencilLine, ChevronDown, ChevronUp, Ruler, FlaskConical, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { format, differenceInDays, isValid, startOfDay } from 'date-fns';
import { useApp } from '../contexts/AppContext';

interface CustomerProfileProps {
  customers: Customer[];
  samples: Sample[];
  onUpdateCustomer: (updated: Customer) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customers, samples, onUpdateCustomer }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, exhibitions, setExhibitions } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'samples'>(
    searchParams.get('tab') === 'samples' ? 'samples' : 'overview'
  );
  
  const [isEditSummaryOpen, setIsEditSummaryOpen] = useState(false);
  const [isEditContactsOpen, setIsEditContactsOpen] = useState(false);
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const [isEditUpcomingPlanOpen, setIsEditUpcomingPlanOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  
  const [showAllInteractions, setShowAllInteractions] = useState(false);

  const [tempSummary, setTempSummary] = useState('');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tempUpcomingPlan, setTempUpcomingPlan] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  // Sort samples by DDL (Soonest first)
  const sortedCustomerSamples = useMemo(() => {
    return [...customerSamples].sort((a, b) => {
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [customerSamples]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'samples') setActiveTab('samples');
    else if (tabParam === 'overview') setActiveTab('overview');
  }, [searchParams]);

  if (!customer) {
    return <div className="p-8 text-center text-slate-500 font-bold">Customer not found. <Button onClick={() => navigate('/customers')}>{t('back')}</Button></div>;
  }

  const saveUpdate = (updatedFields: Partial<Customer>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    onUpdateCustomer({ 
      ...customer, 
      lastStatusUpdate: today, // Default to today for any edit
      ...updatedFields          // Manual date changes in updatedFields will override today
    });
  };

  const handleUpdateSummary = () => {
    saveUpdate({ productSummary: tempSummary });
    setIsEditSummaryOpen(false);
  };

  const handleUpdateTags = () => {
    const finalTags = tempTags.map(t => t.trim()).filter(t => t);
    saveUpdate({ tags: finalTags });
    setIsEditTagsOpen(false);
  };

  const handleUpdateUpcomingPlan = () => {
    saveUpdate({ upcomingPlan: tempUpcomingPlan });
    setIsEditUpcomingPlanOpen(false);
  };

  const togglePrimaryContact = (index: number) => {
    const newContacts = customer.contacts.map((c, i) => ({ ...c, isPrimary: i === index }));
    saveUpdate({ contacts: newContacts });
  };

  const deleteContact = (index: number) => {
    if (confirm('Delete this contact?')) {
      const newContacts = customer.contacts.filter((_, i) => i !== index);
      saveUpdate({ contacts: newContacts });
    }
  };

  const addContact = () => {
    const newContacts = [...customer.contacts, { name: '', title: '', isPrimary: false }];
    saveUpdate({ contacts: newContacts });
  };

  const updateContact = (index: number, fields: Partial<Contact>) => {
    const newContacts = customer.contacts.map((c, i) => i === index ? { ...c, ...fields } : c);
    saveUpdate({ contacts: newContacts });
  };

  const saveInteraction = (updated: Interaction) => {
    const newInteractions = customer.interactions.some(i => i.id === updated.id)
      ? customer.interactions.map(i => i.id === updated.id ? updated : i)
      : [updated, ...customer.interactions];
    newInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    saveUpdate({ 
      interactions: newInteractions,
      lastMyReplyDate: updated.date,
      lastContactDate: updated.date
    });
    setEditingInteraction(null);
  };

  const deleteInteraction = (intId: string) => {
    if (confirm('Delete this interaction log?')) {
      const newInteractions = customer.interactions.filter(i => i.id !== intId);
      saveUpdate({ interactions: newInteractions });
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'My Turn' || status === '我方跟进') return t('statusMyTurn');
    if (status === 'Waiting for Customer' || status === '等待对方') return t('statusWaiting');
    if (status === 'No Action' || status === '暂无') return t('statusNoAction');
    return status;
  };

  const urgency = getUrgencyLevel(customer.nextActionDate);
  const urgencyClass = urgency === 'urgent' ? "bg-rose-50 border-rose-100" : urgency === 'warning' ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200";

  const visibleInteractions = showAllInteractions 
    ? customer.interactions 
    : customer.interactions.slice(0, 3);

  const titleClass = "font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider";
  const contentTextClass = "text-base xl:text-lg font-bold text-slate-800 dark:text-slate-200 leading-relaxed tracking-tight";
  const secondaryTextClass = "text-sm xl:text-base text-slate-500 dark:text-slate-400 font-bold tracking-tight";

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
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
             <MapPin className="w-4 h-4" /> 
             <span>{customer.region.join(', ') || 'Unknown Region'}</span>
           </div>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="p-5 border-l-4 border-l-blue-600 flex flex-col justify-between h-40 shadow-sm">
             <span className="text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest">{t('status')}</span>
             <div className="flex items-center gap-3 my-2">
                 <StatusIcon status={customer.followUpStatus} />
                 <span className="font-black text-xl xl:text-2xl text-slate-900 dark:text-white truncate tracking-tight uppercase">
                   {getStatusLabel(customer.followUpStatus)}
                 </span>
             </div>
             <div className="flex gap-2.5 mt-auto">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(opt => (
                 <button 
                  key={opt} 
                  onClick={() => saveUpdate({ followUpStatus: opt as FollowUpStatus })} 
                  className={`w-4 h-4 xl:w-5 xl:h-5 rounded-full border-2 transition-all ${customer.followUpStatus === opt ? 'bg-blue-600 border-blue-200 scale-125' : 'bg-slate-100 border-transparent hover:bg-slate-200 dark:bg-slate-700'}`} 
                  title={opt} 
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
           <Card className="p-6 xl:p-8 shadow-sm">
             <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-100 dark:border-slate-700">
               <h3 className={titleClass}>
                 <UserCheck className="w-5 h-5 xl:w-6 xl:h-6 text-blue-600" /> {t('keyContacts')}
               </h3>
               <button onClick={() => setIsEditContactsOpen(true)} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95">
                  <PencilLine className="w-4 h-4 xl:w-5 xl:h-5" />
               </button>
             </div>
             <div className="space-y-5">
               {customer.contacts.map((contact, idx) => (
                 <div key={idx} className={`p-5 rounded-2xl border-2 transition-colors ${contact.isPrimary ? 'border-blue-100 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-50 bg-slate-50/20 dark:bg-slate-800/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-black text-slate-900 dark:text-white text-base xl:text-lg">{idx + 1}. {contact.name || 'Unnamed Contact'}</span>
                       {contact.isPrimary && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="text-sm xl:text-base font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight mb-4">{contact.title || 'Position unknown'}</p>
                    <div className="text-sm xl:text-base space-y-2 text-slate-500 font-bold tracking-tight">
                       {contact.email && <div className="flex items-start gap-2 transition-colors hover:text-slate-900 dark:hover:text-slate-100 break-all"><Mail className="w-4 h-4 mt-1 shrink-0"/> {contact.email}</div>}
                       {contact.phone && <div className="flex items-start gap-2 transition-colors hover:text-slate-900 dark:hover:text-slate-100 break-all"><Phone className="w-4 h-4 mt-1 shrink-0"/> {contact.phone}</div>}
                    </div>
                 </div>
               ))}
               <button className="w-full text-xs xl:text-sm font-black uppercase tracking-widest py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center gap-2" onClick={() => { setIsEditContactsOpen(true); addContact(); }}>
                 <Plus className="w-4 h-4" /> Add Contact
               </button>
             </div>
           </Card>
           
           <Card className="p-6 xl:p-8 shadow-sm">
             <div className="flex justify-between items-center mb-8 pb-3 border-b border-slate-100 dark:border-slate-700">
               <h3 className={titleClass}>
                 <List className="w-5 h-5 xl:w-6 xl:h-6 text-indigo-600" /> {t('exhibitions')}
               </h3>
               <button onClick={() => { setTempTags([...customer.tags]); setIsEditTagsOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95">
                 <PencilLine className="w-4 h-4 xl:w-5 xl:h-5" />
               </button>
             </div>
             <div className="space-y-3">
               {customer.tags.length > 0 ? customer.tags.map((tag, i) => {
                 const exh = exhibitions.find(e => e.name === tag);
                 const exhibitionLink = exh?.link || '#';
                 const hasValidLink = exhibitionLink !== '#' && exhibitionLink.trim() !== '';
                 
                 return (
                   <div 
                     key={i} 
                     onClick={() => exh && navigate(`/exhibitions/${exh.id}`)}
                     className={`flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700 group transition-all hover:border-blue-200 ${exh ? 'cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-900/10' : ''}`}
                   >
                      <div className="text-xs xl:text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate flex-1 mr-4">
                         <span className="text-slate-400 mr-2">{i + 1}.</span> {tag}
                      </div>
                      {hasValidLink && (
                        <a 
                          href={exhibitionLink.startsWith('http') ? exhibitionLink : `https://${exhibitionLink}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all active:scale-95"
                          title="View Official Website / Resource"
                        >
                           <span className="text-[10px] font-black uppercase tracking-widest">Link</span>
                           <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                   </div>
                 );
               }) : <span className={secondaryTextClass + " italic"}>No exhibition history logged.</span>}
               <p className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                 Links are managed centrally in Exhibitions tab.
               </p>
             </div>
           </Card>
         </div>

         <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900/40">
               <div className="px-6 xl:px-8 py-5 bg-white dark:bg-slate-800 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-black text-base xl:text-lg text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-wider"><Box className="w-5 h-5 xl:w-6 xl:h-6 text-emerald-600"/> {t('productSummary')}</h3>
                  <button onClick={() => { setTempSummary(customer.productSummary); setIsEditSummaryOpen(true); }} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95">
                    <PencilLine className="w-5 h-5 xl:w-6 xl:h-6"/>
                  </button>
               </div>
               <div className="p-8 xl:p-10">
                  <p className={contentTextClass}>{customer.productSummary || "No summary provided."}</p>
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] xl:text-xs text-slate-400 font-black uppercase tracking-widest">
                     <span>{t('lastUpdated')}: {customer.lastStatusUpdate}</span>
                     <Badge color="green">{customer.status.toUpperCase()}</Badge>
                  </div>
               </div>
            </Card>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit shadow-inner">
              <button onClick={() => setActiveTab('overview')} className={`px-8 py-2.5 rounded-lg font-black text-xs xl:text-sm uppercase tracking-wider transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('overview')}</button>
              <button onClick={() => setActiveTab('samples')} className={`px-8 py-2.5 rounded-lg font-black text-xs xl:text-sm uppercase tracking-wider transition-all ${activeTab === 'samples' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('samples')} ({customerSamples.length})</button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`p-8 xl:p-10 rounded-[2rem] border-2 shadow-sm group relative overflow-hidden transition-all ${urgencyClass}`}>
                  <button onClick={() => { setTempUpcomingPlan(customer.upcomingPlan || ''); setIsEditUpcomingPlanOpen(true); }} className="absolute top-6 right-6 p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95 z-10">
                    <PencilLine className="w-5 h-5 xl:w-6 xl:h-6" />
                  </button>
                  <div className="flex items-center gap-5 mb-6">
                     <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <Clock className="w-7 h-7 xl:w-9 xl:h-9 text-slate-900 dark:text-white" />
                     </div>
                     <div>
                        <h4 className="font-black text-[10px] xl:text-xs text-slate-400 tracking-[0.2em] uppercase mb-1.5">UPCOMING PLAN</h4>
                        <div className="flex items-center gap-3">
                           <span className="text-base xl:text-lg font-black text-slate-900 dark:text-white tracking-tight">DDL: {customer.nextActionDate || 'TBD'}</span>
                           {urgency === 'urgent' && <Badge color="red">URGENT</Badge>}
                        </div>
                     </div>
                  </div>
                  <p className={contentTextClass}>
                     {customer.upcomingPlan || <span className="text-slate-400 italic font-bold">No upcoming plan logged.</span>}
                  </p>
                </div>

                <div className="space-y-8">
                   <div className="flex justify-between items-center">
                     <h3 className={titleClass}>
                        <Calendar className="w-6 h-6 text-blue-600"/> {t('interactionHistory')}
                     </h3>
                     <Button className="text-[10px] xl:text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 font-black uppercase tracking-widest shadow-md" onClick={() => setEditingInteraction({ id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '' })}>
                       <Plus className="w-4 h-4" /> Log Progress
                     </Button>
                   </div>
                   
                   <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 pl-10 py-4 space-y-10">
                     {customer.interactions.length > 0 ? (
                       <>
                         {visibleInteractions.map((int, i) => (
                           <div key={int.id} className="relative group">
                              <div className="absolute -left-[54px] top-0 w-8 h-8 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center font-black text-white text-xs">
                                {customer.interactions.length - i}
                              </div>
                              <div className="flex items-center justify-between mb-4">
                                 <span className="font-black text-sm xl:text-base text-slate-900 dark:text-white tracking-tight">{int.date}</span>
                                 <div className="flex gap-2">
                                    <button onClick={() => setEditingInteraction(int)} className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"><PencilLine className="w-4 h-4 xl:w-5 xl:h-5"/></button>
                                    <button onClick={() => deleteInteraction(int.id)} className="p-2 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all active:scale-95"><Trash2 className="w-4 h-4 xl:w-5 xl:h-5"/></button>
                                 </div>
                              </div>
                              <Card className="p-6 xl:p-8 border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
                                 <p className={contentTextClass}>{int.summary}</p>
                              </Card>
                           </div>
                         ))}
                         
                         {customer.interactions.length > 3 && (
                           <div className="flex justify-center pt-4">
                             <button 
                               onClick={() => setShowAllInteractions(!showAllInteractions)}
                               className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase text-xs tracking-widest hover:text-blue-800 dark:hover:text-blue-300 transition-all group"
                             >
                               {showAllInteractions ? (
                                 <><ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" /> View Less</>
                               ) : (
                                 <><ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" /> View More ({customer.interactions.length - 3} Hidden)</>
                               )}
                             </button>
                           </div>
                         )}
                       </>
                     ) : (
                       <div className={secondaryTextClass + " italic"}>No interactions logged yet.</div>
                     )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-right-4 duration-500">
                 {sortedCustomerSamples.map(sample => {
                   const sampleUrgency = getUrgencyLevel(sample.nextActionDate);
                   const isSampleTestFinished = sample.testStatus === 'Finished' || sample.testStatus === 'Terminated';
                   
                   // Calc countdown for DDL
                   let countdownText = '-';
                   if (sample.nextActionDate && !isSampleTestFinished) {
                      const diff = differenceInDays(parseLocalDate(sample.nextActionDate), startOfDay(new Date()));
                      countdownText = diff === 0 ? 'Today' : diff > 0 ? `${diff}d left` : `${Math.abs(diff)}d overdue`;
                   }

                   // Calc aging
                   let agingText = '-';
                   if (sample.lastStatusDate) {
                      const diff = differenceInDays(startOfDay(new Date()), parseLocalDate(sample.lastStatusDate));
                      agingText = `${diff}d aging`;
                   }

                   return (
                     <Card 
                        key={sample.id} 
                        className="p-6 xl:p-8 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 group bg-white dark:bg-slate-900/40 relative overflow-hidden" 
                        onClick={() => navigate(`/samples/${sample.id}`)}
                     >
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                           {/* Left side: Icon & Main Titles */}
                           <div className="flex items-start gap-5 flex-1 min-w-0">
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-2xl shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                                 <FlaskConical className="text-blue-600 w-8 h-8 xl:w-10 xl:h-10" />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-black text-lg xl:text-2xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight truncate leading-tight">
                                       {sample.sampleName}
                                    </h4>
                                 </div>
                                 <div className="flex items-center gap-3 text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">SKU: {sample.sampleSKU || 'N/A'}</span>
                                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {sample.originalSize} {sample.processedSize ? `> ${sample.processedSize}` : ''}</span>
                                    <span className="flex items-center gap-1">{sample.crystalType} / {sample.productForm}</span>
                                 </div>
                                 
                                 {/* Upcoming Plan snippet */}
                                 {sample.upcomingPlan && (
                                   <div className="flex items-start gap-2 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                      <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                      <p className="text-xs xl:text-sm font-bold text-slate-600 dark:text-slate-300 italic truncate max-w-full" title={sample.upcomingPlan}>
                                         {sample.upcomingPlan}
                                      </p>
                                   </div>
                                 )}
                              </div>
                           </div>

                           {/* Right side: Status & DDL info */}
                           <div className="flex flex-col items-end gap-3 shrink-0 self-stretch justify-between">
                              <div className="flex flex-wrap justify-end gap-2">
                                 <Badge color="blue">{t(sample.status as any)}</Badge>
                                 <Badge color={sample.testStatus === 'Finished' ? 'green' : sample.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                    {t(sample.testStatus as any)}
                                 </Badge>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-black text-[10px] xl:text-xs uppercase tracking-widest ${
                                    isSampleTestFinished ? 'bg-slate-50 text-slate-400 border-slate-100' :
                                    sampleUrgency === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    sampleUrgency === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                 }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {/* Fix: Use isSampleTestFinished instead of undefined isTestFinished */}
                                    <span>DDL: {isSampleTestFinished ? 'N/A' : (sample.nextActionDate || 'TBD')}</span>
                                    {!isSampleTestFinished && sample.nextActionDate && <span className="ml-1 opacity-60">({countdownText})</span>}
                                 </div>
                                 
                                 <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{agingText}</span>
                                    <div className="flex items-center gap-1 text-slate-900 dark:text-white font-black">
                                       <span className="text-xs xl:text-sm uppercase text-slate-400 mr-1">Qty:</span>
                                       <span className="text-lg xl:text-xl">{sample.quantity}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                   );
                 })}
                 
                 {customerSamples.length === 0 && (
                   <div className="col-span-1 py-20 text-center border-4 border-dashed rounded-[2.5rem] text-slate-200 dark:border-slate-800">
                      <Box className="w-16 h-16 xl:w-24 xl:h-24 mx-auto mb-6 opacity-10" />
                      <p className="text-sm xl:text-lg font-black uppercase tracking-[0.2em] text-slate-300">No Samples Tracked</p>
                   </div>
                 )}
              </div>
            )}
         </div>
       </div>

       {/* --- Modals --- */}
       <Modal isOpen={isEditSummaryOpen} onClose={() => setIsEditSummaryOpen(false)} title={t('productSummary')}>
          <div className="space-y-6">
             <textarea className="w-full h-80 p-5 border-2 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-white text-base xl:text-lg transition-all" value={tempSummary} onChange={(e) => setTempSummary(e.target.value)} />
             <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setIsEditSummaryOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateSummary} className="px-8"><Save className="w-5 h-5 mr-1" /> Save Summary</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditUpcomingPlanOpen} onClose={() => setIsEditUpcomingPlanOpen(false)} title="Update Upcoming Plan">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Plan Details (下一步)</label>
                <textarea className="w-full h-40 p-5 border-2 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-800 dark:text-white text-base xl:text-lg transition-all" value={tempUpcomingPlan} onChange={(e) => setTempUpcomingPlan(e.target.value)} placeholder="What is the next objective for this client?" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Date (关键日期 / DDL)</label>
                <input type="date" className="w-full p-4 border-2 rounded-xl font-black text-base xl:text-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-blue-500 transition-all dark:text-white" value={customer.nextActionDate || ''} onChange={(e) => saveUpdate({ nextActionDate: e.target.value })} />
             </div>
             <div className="flex justify-end gap-3 pt-6">
                <Button variant="secondary" onClick={() => setIsEditUpcomingPlanOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateUpcomingPlan} className="px-8"><Save className="w-5 h-5 mr-1" /> Save Plan</Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isEditContactsOpen} onClose={() => setIsEditContactsOpen(false)} title={t('keyContacts')}>
          <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 scrollbar-hide">
             {customer.contacts.map((contact, idx) => (
               <div key={idx} className="p-6 xl:p-8 border-2 rounded-2xl space-y-6 relative bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">Contact #{idx + 1}</span>
                    <div className="flex gap-3">
                       <button onClick={() => togglePrimaryContact(idx)} className={`p-2 rounded-xl transition-all ${contact.isPrimary ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-300 hover:text-amber-400'}`} title="Set as Primary">
                         <Star className="w-6 h-6" fill={contact.isPrimary ? 'currentColor' : 'none'} />
                       </button>
                       <button onClick={() => deleteContact(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90"><Trash2 className="w-6 h-6"/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                       <input className="w-full p-3 border-2 rounded-xl text-sm xl:text-base font-black dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" value={contact.name} onChange={(e) => updateContact(idx, { name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                       <input className="w-full p-3 border-2 rounded-xl text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" value={contact.title} onChange={(e) => updateContact(idx, { title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                       <input className="w-full p-3 border-2 rounded-xl text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" value={contact.email || ''} onChange={(e) => updateContact(idx, { email: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                       <input className="w-full p-3 border-2 rounded-xl text-sm xl:text-base font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" value={contact.phone || ''} onChange={(e) => updateContact(idx, { phone: e.target.value })} />
                    </div>
                  </div>
               </div>
             ))}
             <button className="w-full py-6 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-300 hover:text-blue-600 hover:border-blue-200 transition-all font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3" onClick={addContact}>
               <Plus className="w-6 h-6" /> Add Another Contact
             </button>
          </div>
          <div className="mt-10 flex justify-end">
             <Button onClick={() => setIsEditContactsOpen(false)} className="px-10">Done</Button>
          </div>
       </Modal>

       <Modal isOpen={isEditTagsOpen} onClose={() => setIsEditTagsOpen(false)} title={t('exhibitions').toUpperCase()}>
          <div className="space-y-8">
             <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                {tempTags.map((tag, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-slate-100 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exhibition #{idx + 1}</span>
                       <button 
                         onClick={() => {
                           setTempTags(tempTags.filter((_, i) => i !== idx));
                         }}
                         className="p-1.5 text-slate-300 hover:text-red-500 transition-colors active:scale-90"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                    <div className="space-y-3">
                       <div className="relative">
                          <List className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                          <select 
                            className="w-full p-3.5 pl-12 border-2 rounded-xl font-black uppercase text-blue-600 dark:text-blue-400 dark:bg-slate-800 dark:border-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm xl:text-base transition-all appearance-none"
                            value={tag} 
                            onChange={(e) => {
                              const newTags = [...tempTags];
                              newTags[idx] = e.target.value;
                              setTempTags(newTags);
                            }} 
                          >
                             <option value="">Select or type name...</option>
                             {exhibitions.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                             {!exhibitions.find(ex => ex.name === tag) && tag && <option value={tag}>{tag}</option>}
                          </select>
                       </div>
                       <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center italic">
                          Links are locked. Managed in master list.
                       </div>
                    </div>
                  </div>
                ))}
                <button 
                  className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"
                  onClick={() => {
                    setTempTags([...tempTags, '']);
                  }}
                >
                  <Plus className="w-5 h-5" /> {t('addExhibition')}
                </button>
             </div>
             <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" onClick={() => setIsEditTagsOpen(false)} className="px-8 font-black uppercase tracking-widest">Cancel</Button>
                <Button onClick={handleUpdateTags} className="px-8 font-black uppercase tracking-widest">Save Selection</Button>
             </div>
          </div>
       </Modal>

       {editingInteraction && (
         <Modal isOpen={!!editingInteraction} onClose={() => setEditingInteraction(null)} title="Update Progress Log">
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATE</label>
                 <input type="date" className="w-full p-4 border-2 rounded-xl font-black text-base xl:text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-all" value={editingInteraction.date} onChange={(e) => setEditingInteraction({...editingInteraction, date: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SUMMARY OF PROGRESS</label>
                  <textarea className="w-full h-48 p-5 border-2 rounded-2xl font-bold text-base xl:text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" placeholder="What happened in this interaction?" value={editingInteraction.summary} onChange={(e) => setEditingInteraction({...editingInteraction, summary: e.target.value})} />
               </div>
               <div className="flex justify-end gap-3 pt-6">
                  <Button variant="secondary" onClick={() => setEditingInteraction(null)}>Cancel</Button>
                  <Button onClick={() => saveInteraction(editingInteraction)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-black uppercase tracking-widest"><Save className="w-5 h-5 mr-1" /> Update History</Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default CustomerProfile;
