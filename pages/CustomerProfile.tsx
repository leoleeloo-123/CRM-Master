
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter, getUrgencyLevel } from '../components/Common';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Clock, Plus, Box, ExternalLink, Link as LinkIcon, Save, X, Trash2, Tag, List } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';

interface CustomerProfileProps {
  customers: Customer[];
  samples: Sample[];
  onUpdateCustomer: (updated: Customer) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customers, samples, onUpdateCustomer }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'samples'>('overview');
  
  // Rank Edit State
  const [isEditingRank, setIsEditingRank] = useState(false);

  // Product Summary Edit State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState('');

  // Next Step Edit State
  const [isEditingNextStep, setIsEditingNextStep] = useState(false);
  const [editNextStepText, setEditNextStepText] = useState('');
  const [editNextStepDate, setEditNextStepDate] = useState('');

  // Contacts Edit State
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [editContactsList, setEditContactsList] = useState<Contact[]>([]);
  
  // Exhibition List Edit State
  const [isEditingExhibitions, setIsEditingExhibitions] = useState(false);
  const [editExhibitionList, setEditExhibitionList] = useState<string[]>([]);
  const [newExhibitionInput, setNewExhibitionInput] = useState('');

  // New Interaction State
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [newInteractionDate, setNewInteractionDate] = useState('');
  const [newInteractionText, setNewInteractionText] = useState('');

  // Edit Interaction History State
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [editInteractionDate, setEditInteractionDate] = useState('');
  const [editInteractionText, setEditInteractionText] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  if (!customer) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Customer not found. <Button onClick={() => navigate('/customers')}>{t('back')}</Button></div>;
  }

  // --- Rank Handler ---
  const handleRankChange = (newRank: Rank) => {
    onUpdateCustomer({ ...customer, rank: newRank });
    setIsEditingRank(false);
  };

  // --- Contacts Handlers ---
  const startEditContacts = () => {
    setEditContactsList(customer.contacts ? [...customer.contacts] : []);
    setIsEditingContacts(true);
  };

  const handleSaveContacts = () => {
    onUpdateCustomer({ ...customer, contacts: editContactsList });
    setIsEditingContacts(false);
  };
  
  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
      const newContacts = [...editContactsList];
      newContacts[index] = { ...newContacts[index], [field]: value };
      setEditContactsList(newContacts);
  };

  const handleDeleteContact = (index: number) => {
    if (window.confirm(t('confirmDeleteContact'))) {
       const newContacts = editContactsList.filter((_, i) => i !== index);
       setEditContactsList(newContacts);
    }
  };

  const handleAddContact = () => {
    setEditContactsList([...editContactsList, { name: '', title: '', isPrimary: false }]);
  };

  // --- Product Summary Handlers ---
  const handleSaveSummary = () => {
    onUpdateCustomer({
      ...customer,
      productSummary: editSummaryText,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd')
    });
    setIsEditingSummary(false);
  };

  const startEditSummary = () => {
    setEditSummaryText(customer.productSummary || '');
    setIsEditingSummary(true);
  };

  // --- Next Step Handlers ---
  const handleSaveNextStep = () => {
    const updatedInteractions = [...customer.interactions];
    if (updatedInteractions.length > 0) {
      updatedInteractions[0] = { ...updatedInteractions[0], nextSteps: editNextStepText };
    } else {
      updatedInteractions.push({
        id: `manual_${Date.now()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        summary: 'Next Step Added Manually',
        nextSteps: editNextStepText,
        tags: []
      });
    }

    onUpdateCustomer({
      ...customer,
      nextActionDate: editNextStepDate,
      interactions: updatedInteractions
    });
    setIsEditingNextStep(false);
  };

  const startEditNextStep = () => {
    setEditNextStepText(customer.interactions[0]?.nextSteps || '');
    setEditNextStepDate(customer.nextActionDate || '');
    setIsEditingNextStep(true);
  };

  // --- Exhibition List Handlers ---
  const startEditExhibitions = () => {
    setEditExhibitionList([...customer.tags]);
    setIsEditingExhibitions(true);
  };

  const handleSaveExhibitions = () => {
    onUpdateCustomer({ ...customer, tags: editExhibitionList });
    setIsEditingExhibitions(false);
  };

  const handleAddExhibitionItem = () => {
    if (newExhibitionInput.trim()) {
      setEditExhibitionList([...editExhibitionList, newExhibitionInput.trim()]);
      setNewExhibitionInput('');
    }
  };

  const handleRemoveExhibitionItem = (idx: number) => {
     setEditExhibitionList(editExhibitionList.filter((_, i) => i !== idx));
  };
  
  const handleExhibitionItemChange = (idx: number, val: string) => {
      const newList = [...editExhibitionList];
      newList[idx] = val;
      setEditExhibitionList(newList);
  };


  // --- New Interaction Handlers ---
  const startAddInteraction = () => {
    setNewInteractionDate(format(new Date(), 'yyyy-MM-dd'));
    setNewInteractionText('');
    setIsAddingInteraction(true);
  };

  const handleSaveInteraction = () => {
    if (!newInteractionText.trim()) return;

    const newInteraction: Interaction = {
      id: `int_${Date.now()}`,
      date: newInteractionDate || format(new Date(), 'yyyy-MM-dd'),
      summary: newInteractionText,
      tags: [],
      docLinks: []
    };

    const updatedInteractions = [newInteraction, ...customer.interactions];
    
    onUpdateCustomer({
      ...customer,
      interactions: updatedInteractions,
      lastContactDate: newInteractionDate > (customer.lastContactDate || '') ? newInteractionDate : customer.lastContactDate
    });

    setIsAddingInteraction(false);
    setNewInteractionText('');
  };

  // --- Edit Existing Interaction Handlers ---
  const startEditInteraction = (interaction: Interaction) => {
    setEditingInteractionId(interaction.id);
    setEditInteractionDate(interaction.date);
    setEditInteractionText(interaction.summary);
  };

  const handleSaveEditedInteraction = () => {
    if (!editingInteractionId || !editInteractionText.trim()) return;

    const updatedInteractions = customer.interactions.map(interaction => {
      if (interaction.id === editingInteractionId) {
        return {
          ...interaction,
          date: editInteractionDate,
          summary: editInteractionText
        };
      }
      return interaction;
    });

    const maxDate = updatedInteractions.reduce((max, curr) => curr.date > max ? curr.date : max, '');
    
    onUpdateCustomer({
      ...customer,
      interactions: updatedInteractions,
      lastContactDate: maxDate > (customer.lastContactDate || '') ? maxDate : customer.lastContactDate
    });
    
    setEditingInteractionId(null);
  };

  const handleDeleteInteraction = (interactionId: string) => {
    if (window.confirm(t('confirmDeleteInteraction'))) {
       const updatedInteractions = customer.interactions.filter(i => i.id !== interactionId);
       onUpdateCustomer({
         ...customer,
         interactions: updatedInteractions
       });
       if (editingInteractionId === interactionId) {
         setEditingInteractionId(null);
       }
    }
  };

  const updateFollowUpStatus = (newStatus: FollowUpStatus) => {
    onUpdateCustomer({ ...customer, followUpStatus: newStatus });
  };

  const iconClass = "w-4 h-4 xl:w-5 xl:h-5";
  const regions = Array.isArray(customer.region) ? customer.region.join(' | ') : customer.region;

  // Calculate Urgency for Next Step Color
  const urgency = getUrgencyLevel(customer.nextActionDate);
  let urgencyClass = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  let urgencyIconClass = "text-slate-500";
  
  if (urgency === 'urgent') {
    urgencyClass = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    urgencyIconClass = "text-red-500";
  } else if (urgency === 'warning') {
    urgencyClass = "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    urgencyIconClass = "text-amber-500";
  } else if (urgency === 'safe') {
    urgencyClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    urgencyIconClass = "text-emerald-500";
  }

  const getStatusLabel = (status: string) => {
    if (status === 'My Turn' || status === '我方跟进') return t('statusMyTurn');
    if (status === 'Waiting for Customer' || status === '等待对方') return t('statusWaiting');
    if (status === 'No Action' || status === '暂无') return t('statusNoAction');
    return status;
  };

  const normalizeStatus = (status: string | undefined): string => {
    if (!status) return '';
    const s = status.trim();
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    if (s === '暂无' || s === 'No Action') return 'No Action';
    return s;
  };

  const getDisplaySampleName = (s: Sample) => {
    if (s.crystalType && s.productCategory?.length) {
      const catStr = s.productCategory.map(c => t(c as any)).join(', ');
      const crystal = t(s.crystalType as any);
      const form = t((s.productForm || '') as any);
      const orig = s.originalSize || '';
      const proc = s.processedSize ? ` > ${s.processedSize}` : '';
      return `${crystal} ${catStr} ${form} - ${orig}${proc}`.trim().replace(/\s+/g, ' ');
    }
    return s.sampleName || s.productType;
  };

  const currentStatusNormalized = normalizeStatus(customer.followUpStatus);

  return (
    <div className="space-y-6 xl:space-y-10">
       {/* Header */}
       <div className="flex items-center gap-4 xl:gap-6">
         <button onClick={() => navigate('/customers')} className="p-2 xl:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           <ArrowLeft className="w-5 h-5 xl:w-8 xl:h-8 text-slate-600 dark:text-slate-400" />
         </button>
         <div className="flex-1">
           <div className="flex items-center gap-3 xl:gap-5">
             <h1 className="text-3xl xl:text-5xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
             <div className="flex items-center gap-2 group">
               <RankStars 
                 rank={customer.rank} 
                 editable={isEditingRank} 
                 onRankChange={handleRankChange} 
               />
               {!isEditingRank ? (
                 <button 
                   onClick={() => setIsEditingRank(true)} 
                   className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-opacity"
                   title="Edit Rank"
                 >
                   <Edit size={16} />
                 </button>
               ) : (
                 <button 
                   onClick={() => setIsEditingRank(false)} 
                   className="p-1 text-red-500 hover:text-red-700 transition-colors"
                   title="Cancel Edit"
                 >
                   <X size={16} />
                 </button>
               )}
             </div>
           </div>
           <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2 text-sm xl:text-lg">
             <MapPin className={iconClass} /> {regions} 
             <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
             {customer.tags.map(t => <span key={t} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs xl:text-sm text-slate-600 dark:text-slate-300">{t}</span>)}
           </p>
         </div>
       </div>

       {/* Top Metrics Bar: Tracking Timers */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-8 h-auto lg:h-40">
          <Card className="p-4 xl:p-6 border-l-4 border-l-blue-500 flex flex-col justify-between h-full">
             <div>
                <span className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">{t('status')}</span>
                <div className="flex items-center gap-2 mb-2 xl:mb-4">
                    <StatusIcon status={customer.followUpStatus} />
                    <span className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">
                      {getStatusLabel(customer.followUpStatus) || 'Unknown'}
                    </span>
                </div>
             </div>
             <div className="flex gap-2">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(statusOption => (
                 <button 
                   key={statusOption}
                   onClick={() => updateFollowUpStatus(statusOption as FollowUpStatus)}
                   className={`w-4 h-4 xl:w-6 xl:h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-all hover:scale-110 ${currentStatusNormalized === statusOption ? 'bg-blue-600 ring-2 ring-blue-200 dark:ring-blue-800 scale-110' : 'bg-white dark:bg-slate-700'}`}
                   title={getStatusLabel(statusOption)}
                 />
               ))}
             </div>
          </Card>

          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" />
          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" />
          
          <div className="flex gap-2 xl:gap-4 h-full">
             <div className="flex-1 h-full"><DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" /></div>
             <div className="flex-1 h-full"><DaysCounter date={customer.lastMyReplyDate} label={t('unfollowedDays')} type="elapsed" /></div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-10">
         {/* Left Sidebar Info */}
         <div className="space-y-6 xl:space-y-8">
           <Card className="p-6 xl:p-8 space-y-4 xl:space-y-6">
             <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-base xl:text-xl">
                  {t('keyContacts')}
               </h3>
               {!isEditingContacts ? (
                 <button onClick={startEditContacts} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <Edit className="w-4 h-4 xl:w-5 xl:h-5" />
                 </button>
               ) : (
                 <div className="flex gap-2">
                   <button onClick={handleSaveContacts} className="text-emerald-700 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><Save className="w-4 h-4" /></button>
                   <button onClick={() => setIsEditingContacts(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><X className="w-4 h-4" /></button>
                 </div>
               )}
             </div>

             <div className="space-y-4 xl:space-y-6">
               {!isEditingContacts ? (
                 customer.contacts.map((contact, idx) => (
                   <div key={idx} className="flex gap-3 xl:gap-4 items-start border-b border-slate-50 dark:border-slate-700/50 last:border-0 pb-3 xl:pb-4 last:pb-0">
                     <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs xl:text-sm shrink-0">
                       {contact.name.charAt(0)}
                     </div>
                     <div className="overflow-hidden">
                       <p className="font-bold text-slate-800 dark:text-white text-sm xl:text-lg truncate flex items-center gap-2">
                         {contact.name}
                         {contact.isPrimary && (
                           <Badge color="blue">
                             {t('primaryContact')}
                           </Badge>
                         )}
                       </p>
                       <p className="text-xs xl:text-base text-slate-500 dark:text-slate-400 truncate">{contact.title}</p>
                       <div className="space-y-1 mt-2">
                         {contact.email && (
                           <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                             <Mail className={iconClass} /> <span className="truncate">{contact.email}</span>
                           </div>
                         )}
                         {contact.phone && (
                            <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                              <Phone className={iconClass} /> <span>{contact.phone}</span>
                            </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="space-y-6">
                   {editContactsList.map((contact, idx) => (
                     <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
                        {/* Edit contact fields... (abbreviated for brevity as logic is same as before) */}
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                             <label className="text-[10px] uppercase font-bold text-slate-400">{t('contactName')}</label>
                             <input 
                               className="w-full text-sm border rounded p-1 dark:bg-slate-900 dark:border-slate-600"
                               value={contact.name}
                               onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                             />
                           </div>
                           <div>
                             <label className="text-[10px] uppercase font-bold text-slate-400">{t('contactTitle')}</label>
                             <input 
                               className="w-full text-sm border rounded p-1 dark:bg-slate-900 dark:border-slate-600"
                               value={contact.title}
                               onChange={(e) => handleContactChange(idx, 'title', e.target.value)}
                             />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] uppercase font-bold text-slate-400">{t('contactEmail')}</label>
                           <input 
                             className="w-full text-sm border rounded p-1 dark:bg-slate-900 dark:border-slate-600"
                             value={contact.email || ''}
                             onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] uppercase font-bold text-slate-400">{t('contactPhone')}</label>
                           <input 
                             className="w-full text-sm border rounded p-1 dark:bg-slate-900 dark:border-slate-600"
                             value={contact.phone || ''}
                             onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                           />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                           <label className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={!!contact.isPrimary}
                                onChange={(e) => handleContactChange(idx, 'isPrimary', e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600"
                              />
                              {t('primaryContact')}
                           </label>
                           <button onClick={() => handleDeleteContact(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                   ))}
                   <Button variant="secondary" onClick={handleAddContact} className="w-full text-sm py-2">
                      <Plus className="w-4 h-4 mr-1" /> {t('addContact')}
                   </Button>
                 </div>
               )}
             </div>
           </Card>
           
           {/* REPLACED: Exhibitions List View */}
           <Card className="p-6 xl:p-8 space-y-4 xl:space-y-6">
             <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-base xl:text-xl">
                    <List className={iconClass} /> {t('exhibitions')}
                </h3>
                {!isEditingExhibitions ? (
                  <button onClick={startEditExhibitions} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <Edit className="w-4 h-4 xl:w-5 xl:h-5" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSaveExhibitions} className="text-emerald-700 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><Save className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditingExhibitions(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><X className="w-4 h-4" /></button>
                  </div>
                )}
             </div>
             
             <div className="space-y-3">
               {!isEditingExhibitions ? (
                  <ul className="space-y-2">
                    {customer.tags && customer.tags.length > 0 ? (
                        customer.tags.map((tag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm xl:text-base text-slate-700 dark:text-slate-300">
                           <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                           <span>{tag}</span>
                        </li>
                        ))
                    ) : (
                        <p className="text-xs xl:text-sm text-slate-400 italic">No exhibitions recorded.</p>
                    )}
                  </ul>
               ) : (
                  <div className="space-y-3">
                     {editExhibitionList.map((tag, i) => (
                        <div key={i} className="flex items-center gap-2">
                           <input 
                              type="text" 
                              className="w-full border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600"
                              value={tag}
                              onChange={(e) => handleExhibitionItemChange(i, e.target.value)}
                           />
                           <button onClick={() => handleRemoveExhibitionItem(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                     <div className="flex gap-2 items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <input 
                           type="text"
                           className="flex-1 border rounded p-1.5 text-sm dark:bg-slate-900 dark:border-slate-600"
                           placeholder="Add exhibition..."
                           value={newExhibitionInput}
                           onChange={(e) => setNewExhibitionInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddExhibitionItem()}
                        />
                        <button onClick={handleAddExhibitionItem} className="text-blue-600 bg-blue-50 p-1.5 rounded"><Plus size={16} /></button>
                     </div>
                  </div>
               )}
             </div>
           </Card>
         </div>

         {/* Main Content Area */}
         <div className="lg:col-span-2">
            {/* Status & Product Summary Box */}
            <Card className="mb-6 xl:mb-10 border-l-4 border-l-emerald-500">
               <div className="p-4 xl:p-6 bg-emerald-50/50 dark:bg-emerald-900/20 flex justify-between items-start border-b border-emerald-100 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-base xl:text-xl">
                    <Box className="w-5 h-5 xl:w-6 xl:h-6" /> {t('productSummary')}
                  </h3>
                  {!isEditingSummary ? (
                    <button onClick={startEditSummary} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900">
                      <Edit className="w-5 h-5 xl:w-6 xl:h-6" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                       <button onClick={handleSaveSummary} className="text-emerald-700 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><Save className="w-5 h-5" /></button>
                       <button onClick={() => setIsEditingSummary(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><X className="w-5 h-5" /></button>
                    </div>
                  )}
               </div>
               <div className="p-5 xl:p-8">
                  {isEditingSummary ? (
                    <textarea 
                      className="w-full border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-base xl:text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[150px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={editSummaryText}
                      onChange={(e) => setEditSummaryText(e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-sm xl:text-xl">
                      {customer.productSummary || "No summary provided."}
                    </p>
                  )}
                  <div className="mt-4 text-xs xl:text-sm text-slate-400 text-right">
                    {t('lastUpdated')}: {customer.lastStatusUpdate || 'Never'}
                  </div>
               </div>
            </Card>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 xl:mb-8 bg-white dark:bg-slate-800 rounded-t-lg">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 xl:px-8 xl:py-4 font-medium text-sm xl:text-lg border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('overview')}
              </button>
              <button 
                onClick={() => setActiveTab('samples')}
                className={`px-6 py-3 xl:px-8 xl:py-4 font-medium text-sm xl:text-lg border-b-2 transition-colors ${activeTab === 'samples' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('samples')} ({customerSamples.length})
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 xl:space-y-8">
                
                {/* Next Steps Highlight */}
                <div className={`border p-4 xl:p-6 rounded-lg mb-6 xl:mb-8 transition-colors ${urgencyClass}`}>
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-3 xl:gap-5 mb-1">
                        <Clock className={`${urgencyIconClass} shrink-0 w-5 h-5 xl:w-8 xl:h-8`} />
                        <h3 className="text-slate-800 dark:text-white font-bold text-sm xl:text-lg">Next Step</h3>
                     </div>
                     {!isEditingNextStep ? (
                       <button onClick={startEditNextStep} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <Edit className="w-5 h-5 xl:w-6 xl:h-6" />
                       </button>
                     ) : (
                       <div className="flex gap-2">
                          <button onClick={handleSaveNextStep} className="text-emerald-700 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><Save className="w-5 h-5" /></button>
                          <button onClick={() => setIsEditingNextStep(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><X className="w-5 h-5" /></button>
                       </div>
                     )}
                  </div>

                  <div className="pl-8 xl:pl-12">
                     {isEditingNextStep ? (
                       <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">DDL Date</label>
                            <input 
                              type="date"
                              className="border rounded p-2 text-sm w-full md:w-auto bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                              value={editNextStepDate}
                              onChange={(e) => setEditNextStepDate(e.target.value)}
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Action Plan</label>
                            <textarea 
                              className="w-full border rounded p-2 text-sm xl:text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 min-h-[80px]"
                              value={editNextStepText}
                              onChange={(e) => setEditNextStepText(e.target.value)}
                            />
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs xl:text-base font-bold uppercase ${urgencyIconClass}`}>
                               DDL: {customer.nextActionDate || 'N/A'}
                            </span>
                         </div>
                         <p className="text-sm xl:text-lg text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                            {customer.interactions[0]?.nextSteps || "No next steps defined."}
                         </p>
                       </>
                     )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 xl:mb-6">
                   <h3 className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{t('interactionHistory')}</h3>
                   {!isAddingInteraction && (
                     <Button variant="secondary" onClick={startAddInteraction} className="text-xs xl:text-sm py-1 xl:py-2">
                       <Plus className="w-3.5 h-3.5 xl:w-5 xl:h-5 mr-1"/> {t('logInteraction')}
                     </Button>
                   )}
                </div>

                {/* New Interaction Form */}
                {isAddingInteraction && (
                  <Card className="mb-6 p-4 xl:p-6 border-l-4 border-l-blue-500 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">New Interaction</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Date</label>
                        <input 
                          type="date"
                          className="border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                          value={newInteractionDate}
                          onChange={(e) => setNewInteractionDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Summary</label>
                        <textarea 
                          className="w-full border rounded p-2 text-sm xl:text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 min-h-[100px]"
                          placeholder="What was discussed?"
                          value={newInteractionText}
                          onChange={(e) => setNewInteractionText(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsAddingInteraction(false)}>Cancel</Button>
                        <Button onClick={handleSaveInteraction}>Save Interaction</Button>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 xl:ml-6 space-y-8 xl:space-y-12 pl-8 xl:pl-10 py-2">
                  {customer.interactions.map((interaction, idx) => (
                    <div key={interaction.id} className="relative">
                       {/* Timeline Dot */}
                       <div className="absolute -left-[41px] xl:-left-[50px] top-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 shadow-sm"></div>
                       
                       {editingInteractionId === interaction.id ? (
                         <Card className="p-4 xl:p-6 bg-white dark:bg-slate-800 border-2 border-blue-500 dark:border-blue-400 shadow-lg relative">
                             <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                               <Edit className="w-4 h-4" /> Edit Interaction
                             </h4>
                             <div className="space-y-4">
                               <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Date</label>
                                 <input 
                                   type="date"
                                   className="border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 w-full md:w-auto"
                                   value={editInteractionDate}
                                   onChange={(e) => setEditInteractionDate(e.target.value)}
                                 />
                               </div>
                               <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Summary</label>
                                 <textarea 
                                   className="w-full border rounded p-2 text-sm xl:text-base bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 min-h-[100px]"
                                   value={editInteractionText}
                                   onChange={(e) => setEditInteractionText(e.target.value)}
                                 />
                               </div>
                               <div className="flex justify-between items-center pt-2">
                                 <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => handleDeleteInteraction(interaction.id)}>
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                 </Button>
                                 <div className="flex gap-2">
                                   <Button variant="ghost" onClick={() => setEditingInteractionId(null)}>Cancel</Button>
                                   <Button onClick={handleSaveEditedInteraction}>Save Changes</Button>
                                 </div>
                               </div>
                             </div>
                         </Card>
                       ) : (
                         <>
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 xl:mb-3">
                             <span className="text-sm xl:text-lg font-bold text-slate-800 dark:text-slate-200">{interaction.date}</span>
                             <div className="flex gap-2 mt-1 sm:mt-0">
                               {interaction.tags?.map(t => <Badge key={t} color="purple">{t}</Badge>)}
                             </div>
                           </div>
                           
                           <Card className="p-4 xl:p-6 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow group relative">
                             {/* Hover Edit Button */}
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => startEditInteraction(interaction)} 
                                 className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                 title="Edit Record"
                               >
                                 <Edit className="w-4 h-4 xl:w-5 xl:h-5" />
                               </button>
                             </div>

                             <p className="text-slate-700 dark:text-slate-300 text-sm xl:text-lg whitespace-pre-wrap pr-6">{interaction.summary}</p>
                             
                             {interaction.docLinks && interaction.docLinks.length > 0 && (
                               <div className="mt-3 xl:mt-4 flex flex-wrap gap-2">
                                 {interaction.docLinks.map((link, li) => (
                                   <a key={li} href={link} target="_blank" className="flex items-center gap-1 text-xs xl:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 xl:px-3 xl:py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                     <LinkIcon className="w-3 h-3 xl:w-4 xl:h-4" /> Link {li+1}
                                   </a>
                                 ))}
                               </div>
                             )}
                           </Card>
                         </>
                       )}
                    </div>
                  ))}
                  {customer.interactions.length === 0 && !isAddingInteraction && <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg italic">No interactions recorded yet.</p>}
                </div>
              </div>
            )}

            {/* Samples Tab */}
            {activeTab === 'samples' && (
              <div className="space-y-4 xl:space-y-6">
                 <div className="flex justify-end">
                   <Button className="flex items-center gap-2 text-sm xl:text-base" onClick={() => navigate('/samples')}><Plus className={iconClass} /> {t('newRequest')}</Button>
                 </div>
                 {customerSamples.length === 0 ? (
                   <div className="text-center p-8 xl:p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
                     <Box className="mx-auto mb-2 opacity-50 w-10 h-10 xl:w-16 xl:h-16" />
                     <p className="text-sm xl:text-lg">{t('noSamples')}</p>
                   </div>
                 ) : (
                   customerSamples.map(sample => (
                     <Card key={sample.id} className="p-4 xl:p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/samples/${sample.id}`)}>
                       <div className="flex justify-between items-start">
                         <div className="flex gap-4 xl:gap-6">
                            <div className="p-3 xl:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg h-fit">
                              <Box className="text-blue-600 dark:text-blue-400 w-5 h-5 xl:w-7 xl:h-7" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 xl:gap-3">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm xl:text-xl">{getDisplaySampleName(sample)}</h4>
                                <Badge color="gray">{sample.quantity}</Badge>
                              </div>
                              <p className="text-sm xl:text-lg text-slate-600 dark:text-slate-300 mt-1">{t('specs')}: {sample.specs}</p>
                              <div className="mt-2 text-xs xl:text-base text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                <span>Requested: {sample.requestDate}</span>
                                {sample.trackingNumber && (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><ExternalLink className="w-3 h-3 xl:w-4 xl:h-4" /> {sample.trackingNumber}</span>
                                )}
                              </div>
                            </div>
                         </div>
                         <div className="text-right">
                           <div className="flex items-center justify-end gap-1 mb-2">
                              <StatusIcon status={sample.status} />
                              <span className="font-medium text-sm xl:text-lg text-slate-700 dark:text-slate-300">{sample.status}</span>
                           </div>
                           {sample.feedback && (
                             <div className="text-xs xl:text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 xl:px-3 xl:py-2 rounded max-w-[200px] xl:max-w-[300px] truncate">
                               Feedback: {sample.feedback}
                             </div>
                           )}
                         </div>
                       </div>
                     </Card>
                   ))
                 )}
              </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default CustomerProfile;
